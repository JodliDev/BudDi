import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {AuthorisedMessageAction} from "../AuthorisedMessageAction";
import {column} from "../../database/column";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {User} from "../../database/dataClasses/User";
import {ChangePasswordMessage} from "../../../../shared/messages/ChangePasswordMessage";
import {DeleteAccountMessage} from "../../../../shared/messages/DeleteAccountMessage";

export class DeleteAccountMessageAction extends AuthorisedMessageAction<DeleteAccountMessage> {
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		db.delete(User, `${column(User, "userId")} = ${session.userId}`)
		session.send(new ConfirmResponseMessage(this.data, true))
	}
}
