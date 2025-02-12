import {WebSocket} from "ws";
import {BaseMessage} from "../../../shared/BaseMessage";
import {IsAdminMessage} from "../../../shared/messages/IsAdminMessage";

export class WebSocketSession {
	public isLoggedIn: boolean = false
	public isAdmin: boolean = false
	public isAlive: boolean = true
	public userId?: number | bigint
	
	constructor(private ws: WebSocket) { }
	
	public send(message: BaseMessage) {
		this.ws.send(JSON.stringify(message))
	}
	public sendBinary(blob: ArrayBuffer | Buffer | Buffer[]) {
		this.ws.send(blob)
	}
	
	public login(userId: number | bigint, isAdmin: boolean = false) {
		this.isLoggedIn = true
        this.userId = userId
		
		if(isAdmin) {
			this.isAdmin = true
			this.send(new IsAdminMessage())
		}
	}
	public logout() {
		this.isLoggedIn = false
        this.userId = undefined
	}
}
