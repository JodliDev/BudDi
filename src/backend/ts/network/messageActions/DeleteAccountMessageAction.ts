import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {LoggedInMessageAction} from "../LoggedInMessageAction";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {User} from "../../database/dataClasses/User";
import {DeleteAccountMessage} from "../../../../shared/messages/DeleteAccountMessage";
import {SqlWhere} from "../../database/SqlWhere";

// noinspection JSUnusedGlobalSymbols
export class DeleteAccountMessageAction extends LoggedInMessageAction<DeleteAccountMessage> {
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		db.delete(User, SqlWhere(User).is("userId", session.userId))
		session.send(new ConfirmResponseMessage(this.data, true))
	}
}
