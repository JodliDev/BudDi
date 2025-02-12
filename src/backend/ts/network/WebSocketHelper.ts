import {WebSocketServer} from "ws";
import {BaseMessage} from "../../../shared/BaseMessage";
import {BaseBackendMessageAction} from "./BaseBackendMessageAction";
import {WebSocketSession} from "./WebSocketSession";
import {ErrorMessage} from "../../../shared/messages/ErrorMessage";
import {Options} from "../Options";
import {getCookie} from "../../../shared/Cookies";
import {SessionLoginMessageAction} from "./messageActions/SessionLoginMessageAction";
import {SessionLoginMessage} from "../../../shared/messages/SessionLoginMessage";
import {ConfirmMessage} from "../../../shared/messages/ConfirmMessage";
import {ServerSettingsMessage} from "../../../shared/messages/ServerSettingsMessage";
import {Server} from "node:http";
import {ConfirmResponseMessage} from "../../../shared/messages/ConfirmResponseMessage";
import {BinaryUploadMessage} from "../../../shared/messages/BinaryUploadMessage";
import {FaultyInputException} from "../exceptions/FaultyInputException";

interface OwnWebSocket {
	session?: WebSocketSession
}

export class WebSocketHelper {
	public static readonly MAX_JSON_LENGTH = 1e+6 // 1 MB
	private readonly wss: WebSocketServer;
	
	constructor(options: Options, server: Server, onMessage: (message: BaseBackendMessageAction<BaseMessage>, session: WebSocketSession) => Promise<void>) {
		this.wss = new WebSocketServer({
			server
		})
		
		this.wss.on('listening', () => console.log(`WebSocket is listing on http://localhost:${options.portHttp}${options.pathWs}`));
		
		this.wss.on('connection', async (ws, connection) => {
			const session = new WebSocketSession(ws)
			const ownWebSocket = ws as unknown as OwnWebSocket
			ownWebSocket.session = session
			
			session.send(new ServerSettingsMessage(Options.serverSettings))
			
			const cookies = connection.headers.cookie
			if(cookies) {
				const sessionId = getCookie("sessionId", cookies)
				const sessionHash = getCookie("sessionHash", cookies)
				const sessionTimestamp = getCookie("sessionTimestamp", cookies)
				
				if(sessionHash && sessionId && sessionTimestamp)
					await onMessage(new SessionLoginMessageAction(new SessionLoginMessage(parseInt(sessionId), sessionHash, parseInt(sessionTimestamp))), session)
			}
			
			ws.on('error', console.error)
			let binaryMessage: BinaryUploadMessage | null = null
			ws.on('message', async (data, isBinary) => {
				let confirmMessage: ConfirmMessage | null = null
				try {
					let message: BaseMessage
					if(isBinary) {
						if(!binaryMessage)
							return
						
						binaryMessage.receiveFile = data
						message = binaryMessage //message is complete now. We can continue as usual
						binaryMessage = null
					}
					else {
						const stringData = data.toString()
						if(stringData.length > WebSocketHelper.MAX_JSON_LENGTH)
							throw new FaultyInputException()
						
						message = JSON.parse(stringData)
						if(BinaryUploadMessage.isBinaryMessage(message)) {
							binaryMessage = message //store message until actual binary data arrives
							session.send(new ConfirmResponseMessage(binaryMessage.initialConfirm, true)) //send a response that binary data can be sent
							return
						}
					}
					
					if(ConfirmMessage.isConfirmMessage(message))
						confirmMessage = message
					
					const className = `${message.name}Action`
					const messageClass = await require(`./messageActions/${className}`);
					
					if(messageClass && messageClass.hasOwnProperty(className)) {
						const messageAction = new messageClass[className](message) as BaseBackendMessageAction<BaseMessage>;
						await onMessage(messageAction, session)
					}
					confirmMessage = null
				}
				catch(e: unknown) {
					const message = (e as Error)?.name ?? "errorUnknown"
					console.trace(e)
					
					session.send(confirmMessage
						? new ConfirmResponseMessage(confirmMessage, false, message)
						: new ErrorMessage(message)
					)
				}
			})
			
			ws.on('pong', () => {
				session.isAlive = true
			})
		})
		
		const interval = setInterval(() => {
			for(const ws of this.wss.clients) {
				const ownWebSocket = ws as unknown as OwnWebSocket
				if(!ownWebSocket.session?.isAlive)
					return ws.terminate()
				
				ownWebSocket.session.isAlive = false
				ws.ping()
			}
		}, options.keepAliveTimeoutMs)
		
		this.wss.on('close', () => {
			clearInterval(interval);
		})
	}
}
