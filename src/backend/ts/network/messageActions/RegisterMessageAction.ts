import {LoginMessage} from "../../../../shared/messages/LoginMessage";
import {BaseBackendMessageAction} from "../BaseBackendMessageAction";
import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {User} from "../../database/dataClasses/User";
import bcrypt from "bcrypt";
import {column} from "../../database/column";
import {Lang} from "../../../../shared/Lang";
import {ConfirmMessage} from "../../../../shared/messages/ConfirmMessage";
import {LoginResponseMessage} from "../../../../shared/messages/LoginResponseMessage";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {ReasonedConfirmResponseMessage} from "../../../../shared/messages/ReasonedConfirmResponseMessage";


export class RegisterMessageAction extends BaseBackendMessageAction<LoginMessage> {
	
	async exec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const [existingUser] = db.tableSelect(User, `${column(User, "username")} = '${this.data.username}'`, 1)
		if(existingUser) {
			session.send(new ReasonedConfirmResponseMessage(this.data, false, Lang.get("errorUserAlreadyExists")))
			return
		}
		
		const salt = await bcrypt.genSalt()
		const hash = await bcrypt.hash(this.data.password, salt)
		
		const newUser = {
			username: this.data.username,
			hashedPassword: hash,
			isAdmin: db.tableSelect(User, undefined, 1).length == 0
		} as User
		
		const userId = db.insert(User, newUser)
		const success = userId != 0
		session.login(userId)
		session.send(new ConfirmResponseMessage(this.data, success))
	}
}
