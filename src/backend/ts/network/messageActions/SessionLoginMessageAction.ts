import {BaseBackendMessageAction} from "../BaseBackendMessageAction";
import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {LoginSession} from "../../database/dataClasses/LoginSession";
import {SessionLoginMessage} from "../../../../shared/messages/SessionLoginMessage";
import {User} from "../../database/dataClasses/User";
import {IsLoggedInMessage} from "../../../../shared/messages/IsLoggedInMessage";
import {SqlWhere} from "../../database/SqlWhere";

// noinspection JSUnusedGlobalSymbols
export class SessionLoginMessageAction extends BaseBackendMessageAction<SessionLoginMessage> {
	async exec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const sqlConstraint = SqlWhere(LoginSession).is("loginSessionId", this.data.sessionId)
		const [loginSession] = db.selectTable(LoginSession, sqlConstraint, 1)
		if(!loginSession)
			return
		const timedHash = await SessionLoginMessage.createSessionHash(loginSession.sessionSecret, this.data.sessionTimestamp)
		
		if(this.data.sessionTimestamp < Date.now() - 1000 * 60 * 30 || timedHash != this.data.sessionHash)
			return
		
		db.update(LoginSession, { "=": { lastLogin: Date.now()} }, sqlConstraint, 1)
		
		const [user] = db.selectTable(User, SqlWhere(User).is("userId", loginSession.userId), 1)
		
		session.login(user.userId, user.isAdmin)
		session.send(new IsLoggedInMessage({
			sessionId: loginSession.loginSessionId,
			username: user.username,
			currency: user.currency
		}))
	}
}
