import {BaseBackendMessageAction} from "../BaseBackendMessageAction";
import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {User} from "../../database/dataClasses/User";
import bcrypt from "bcrypt";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {UsernameAlreadyExistsException} from "../../exceptions/UsernameAlreadyExistsException";
import {Options} from "../../Options";
import {NoPermissionException} from "../../exceptions/NoPermissionException";
import {RegisterMessage} from "../../../../shared/messages/RegisterMessage";
import {SqlWhere} from "../../database/SqlWhere";

// noinspection JSUnusedGlobalSymbols
export class RegisterMessageAction extends BaseBackendMessageAction<RegisterMessage> {
	async exec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		if(!Options.serverSettings.registrationAllowed)
			throw new NoPermissionException()
		const [existingUser] = db.selectTable(User, {where: SqlWhere(User).is("username", this.data.username), limit: 1})
		if(existingUser)
			throw new UsernameAlreadyExistsException()
		
		const salt = await bcrypt.genSalt()
		const hash = await bcrypt.hash(this.data.password, salt)
		
		const userData = {
			username: this.data.username,
			hashedPassword: hash,
			isAdmin: db.selectTable(User, {limit: 1}).length == 0
		} as Partial<User>
		
		const userId = db.insert(User, userData)
		const [user] = db.selectTable(User, {where: SqlWhere(User).is("userId", userId), limit: 1})
		const success = userId != 0
		session.login(userId, user.isAdmin)
		session.send(new ConfirmResponseMessage(this.data, success))
	}
}
