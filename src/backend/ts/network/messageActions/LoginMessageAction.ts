import {LoginMessage} from "../../../../shared/messages/LoginMessage";
import {BaseBackendMessageAction} from "../BaseBackendMessageAction";
import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {ConfirmMessage} from "../../../../shared/messages/ConfirmMessage";
import {User} from "../../database/dataClasses/User";
import {column} from "../../database/column";
import bcrypt from "bcrypt";
import {LoginSession} from "../../database/dataClasses/LoginSession";
import {LoginResponseMessage} from "../../../../shared/messages/LoginResponseMessage";
import {NoPermissionException} from "../../exceptions/NoPermissionException";

export class LoginMessageAction extends BaseBackendMessageAction<LoginMessage> {
	
	async exec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const [user] = db.tableSelect(User, `${column(User, "username")} = '${this.data.username}'`, 1)
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
		db.insert(LoginSession, newSession)
		
		session.login(user.userId)
		session.send(new LoginResponseMessage(this.data, true, user.userId, newSession.sessionHash))
	}
}
