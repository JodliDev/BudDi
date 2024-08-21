import {LoginMessage} from "../../../../shared/messages/LoginMessage";
import {BaseBackendMessageAction} from "../BaseBackendMessageAction";
import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {User} from "../../database/dataClasses/User";
import bcrypt from "bcrypt";
import {column} from "../../database/column";
import {Lang} from "../../../../shared/Lang";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {ReasonedConfirmResponseMessage} from "../../../../shared/messages/ReasonedConfirmResponseMessage";
import {UsernameAlreadyExistsException} from "../../exceptions/UsernameAlreadyExistsException";


export class RegisterMessageAction extends BaseBackendMessageAction<LoginMessage> {
	
	async exec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const [existingUser] = db.tableSelect(User, `${column(User, "username")} = '${this.data.username}'`, 1)
		if(existingUser)
			throw new UsernameAlreadyExistsException()
		
		const salt = await bcrypt.genSalt()
		const hash = await bcrypt.hash(this.data.password, salt)
		
		const userData = {
			username: this.data.username,
			hashedPassword: hash,
			isAdmin: db.tableSelect(User, undefined, 1).length == 0
		} as Partial<User>
		
		const userId = db.insert(User, userData)
		const [user] = db.tableSelect(User, `${column(User, "userId")} = ${userId}`)
		const success = userId != 0
		session.login(userId, user.isAdmin)
		session.send(new ConfirmResponseMessage(this.data, success))
	}
}
