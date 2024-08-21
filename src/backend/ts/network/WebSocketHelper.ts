import {WebSocketServer} from "ws";
import {BaseMessage} from "../../../shared/BaseMessage";
import {BaseBackendMessageAction} from "./BaseBackendMessageAction";
import {WebSocketSession} from "./WebSocketSession";
import {ErrorMessage} from "../../../shared/messages/ErrorMessage";
import {Lang} from "../../../shared/Lang";
import {Options} from "../Options";
import {Cookies} from "../../../shared/Cookies";
import {SessionLoginMessageAction} from "./messageActions/SessionLoginMessageAction";
import {SessionLoginMessage} from "../../../shared/messages/SessionLoginMessage";
import {ConfirmMessage} from "../../../shared/messages/ConfirmMessage";
import {ReasonedConfirmResponseMessage} from "../../../shared/messages/ReasonedConfirmResponseMessage";

export class WebSocketHelper {
	private readonly wss: WebSocketServer;
	
	constructor(options: Options, onMessage: (message: BaseBackendMessageAction<BaseMessage>, session: WebSocketSession) => Promise<void>) {
		this.wss = new WebSocketServer({
			port: options.portWs,
			path: options.pathWs
		})
		
		this.wss.on('listening', () => console.log(`WebSocket is listing on http://localhost:${options.portWs}${options.pathWs}`));
		
		this.wss.on('connection', async (ws, connection) => {
			const session = new WebSocketSession(ws)
			
			const cookies = connection.headers.cookie
			if(cookies) {
				const sessionHash = this.getCookie("sessionHash", cookies)
				const userId = this.getCookie("userId", cookies)
				
				if(sessionHash && userId)
					await onMessage(new SessionLoginMessageAction(new SessionLoginMessage(parseInt(userId), sessionHash)), session)
			}
			ws.on('error', console.error)
			
			ws.on('message', async (data ) => {
				let confirmMessage: ConfirmMessage | null = null
				
				try {
					const message = JSON.parse(data.toString()) as BaseMessage
					if(ConfirmMessage.isConfirmMessage(message))
						confirmMessage = message
					
					const className = `${message.name}Action`
					const messageClass = await require(`./messageActions/${className}`);
					
					if(messageClass) {
						const messageAction = new messageClass[className](message) as BaseBackendMessageAction<BaseMessage>;
						await onMessage(messageAction, session)
					}
					confirmMessage = null
				}
				catch(e: unknown) {
					const message = (e as Error)?.message ?? Lang.get("errorUnknown")
					console.trace(e instanceof Error ? e.stack : e)
					
					session.send(confirmMessage
						? new ReasonedConfirmResponseMessage(confirmMessage, false, message)
						: new ErrorMessage(message)
					)
				}
			})
		})
	}
	
	private getCookie(name: keyof typeof Cookies, cookieString: string): string | undefined {
		//Thanks to: https://stackoverflow.com/questions/10730362/get-cookie-by-name
		const value = `; ${cookieString}`
		const parts = value.split(`; ${name}=`)
		if(parts.length === 2)
			return parts.pop()?.split(';').shift()
	}
}
