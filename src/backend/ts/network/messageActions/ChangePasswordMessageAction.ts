import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {AuthorisedMessageAction} from "../AuthorisedMessageAction";
import {column} from "../../database/column";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {User} from "../../database/dataClasses/User";
import bcrypt from "bcrypt";
import {ChangePasswordMessage} from "../../../../shared/messages/ChangePasswordMessage";

export class ChangePasswordMessageAction extends AuthorisedMessageAction<ChangePasswordMessage> {
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const salt = await bcrypt.genSalt()
		const hash = await bcrypt.hash(this.data.password, salt)
		
		db.update(
			User,
			{
				"=": { hashedPassword: hash }
			},
			`${column(User, "userId")} = ${session.userId}`
		)
		session.send(new ConfirmResponseMessage(this.data, true))
	}
}
