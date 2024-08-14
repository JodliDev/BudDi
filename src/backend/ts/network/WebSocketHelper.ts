import {WebSocketServer} from "ws";
import {BaseMessage} from "../../../shared/BaseMessage";
import {BaseBackendMessageAction} from "./BaseBackendMessageAction";
import {WebSocketSession} from "./WebSocketSession";
import {ErrorMessage} from "../../../shared/messages/ErrorMessage";
import {Lang} from "../../../shared/Lang";
import {Options} from "../Options";
import {Cookies} from "../../../shared/Cookies";
import {LoginSession} from "../database/dataClasses/LoginSession";
import {column} from "../database/column";
import {SessionLoginMessageAction} from "./messageActions/SessionLoginMessageAction";
import {SessionLoginMessage} from "../../../shared/messages/SessionLoginMessage";

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
				try {
					const message = JSON.parse(data.toString()) as BaseMessage
					const className = `${message.name}Action`
					const messageClass = await import(`./messageActions/${className}`);
					
					if(messageClass) {
						const messageAction = new messageClass[className](message) as BaseBackendMessageAction<BaseMessage>;
						await onMessage(messageAction, session)
					}
				}
				catch(e: unknown) {
					if(e instanceof Error)
						console.trace(e.stack)
					else
						console.trace(e)
					session.send(new ErrorMessage((e as Error)?.message ?? Lang.get("errorUnknown")))
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
