import {BaseBackendMessageAction} from "../BaseBackendMessageAction";
import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {column} from "../../database/column";
import {LoginSession} from "../../database/dataClasses/LoginSession";
import {SessionLoginMessage} from "../../../../shared/messages/SessionLoginMessage";

export class SessionLoginMessageAction extends BaseBackendMessageAction<SessionLoginMessage> {
	
	async exec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const sqlConstraint = `${column(LoginSession, "userId")} = '${this.data.userId}' AND ${column(LoginSession, "sessionHash")} = '${this.data.sessionHash}'`
		const [loginSession] = db.tableSelect(
			LoginSession,
			sqlConstraint, 
			1
		)

		if(!loginSession)
			return
		
		const newSession = LoginSession.getNewSession(this.data.userId, loginSession.existsSince)
		db.update(LoginSession, newSession, sqlConstraint, 1)
		
		session.login(this.data.userId)
		session.send(new SessionLoginMessage(this.data.userId, newSession.sessionHash))
	}
}
