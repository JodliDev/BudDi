import {WebSocket} from "ws";
import {BaseMessage} from "../../../shared/BaseMessage";
import {LoginResponseMessage} from "../../../shared/messages/LoginResponseMessage";
import {UserSettingsMessage} from "../../../shared/messages/UserSettingsMessage";

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
		
		
		this.send(new UserSettingsMessage({
			currency: currency
		}))
	}
	public logout() {
		this.isLoggedIn = false
        this.userId = undefined
	}
}
