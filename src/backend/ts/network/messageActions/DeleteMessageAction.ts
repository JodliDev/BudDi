import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {DeleteMessage} from "../../../../shared/messages/DeleteMessage";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {SqlWhere} from "../../database/SqlWhere";
import {BaseListMessageAction} from "./BaseListMessageAction";

// noinspection JSUnusedGlobalSymbols
export class DeleteMessageAction extends BaseListMessageAction<DeleteMessage> {
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const values = await this.getValues()
		
		const where = SqlWhere(values.tableClass).is(values.settings.primaryKey, this.data.id)
		
		values.settings?.onBeforeDeleteFromList(this.data.id, db, session)
		const response = db.delete(values.tableClass, values.settings?.getWhere(session, where) ?? where, 1)
		values.settings?.onAfterDeleteFromList(this.data.id, db, session)
		
		session.send(new ConfirmResponseMessage(this.data, response == 1))
	}
}
