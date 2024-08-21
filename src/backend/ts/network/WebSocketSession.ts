import {WebSocket} from "ws";
import {BaseMessage} from "../../../shared/BaseMessage";

export class WebSocketSession {
	public isLoggedIn: boolean = false;
	public userId?: number | bigint;
	
	constructor(private ws: WebSocket) {
	
	}
	
	public send(message: BaseMessage) {
		this.ws.send(JSON.stringify(message))
	}
	
	public login(userId: number | bigint, currency: string) {
		this.isLoggedIn = true
        this.userId = userId
	}
	public logout() {
		this.isLoggedIn = false
        this.userId = undefined
	}
}
