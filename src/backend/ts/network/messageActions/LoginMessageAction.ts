import {LoginMessage} from "../../../../shared/messages/LoginMessage";
import {BaseBackendMessageAction} from "../BaseBackendMessageAction";
import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {User} from "../../database/dataClasses/User";
import bcrypt from "bcrypt";
import {LoginSession} from "../../database/dataClasses/LoginSession";
import {LoginResponseMessage} from "../../../../shared/messages/LoginResponseMessage";
import {SqlWhere} from "../../database/SqlWhere";

// noinspection JSUnusedGlobalSymbols
export class LoginMessageAction extends BaseBackendMessageAction<LoginMessage> {
	async exec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const [user] = db.selectTable(User, {where: SqlWhere(User).is("username", this.data.username), limit: 1})
		if(!user) {
			session.send(new LoginResponseMessage(this.data, false))
			return
		}
		
		const passwordCorrect = await bcrypt.compare(this.data.password, user.hashedPassword)
		if(!passwordCorrect) {
			session.send(new LoginResponseMessage(this.data, false))
			return
		}
		
		
		const newSession = LoginSession.getNewSession(user.userId)
		const sessionId = db.insert(LoginSession, newSession)
		
		session.login(user.userId, user.isAdmin)
		session.send(new LoginResponseMessage(
			this.data,
			true,
			{
				sessionId: sessionId,
				username: user.username,
				currency: user.currency
			},
			newSession.sessionSecret
		))
	}
}
