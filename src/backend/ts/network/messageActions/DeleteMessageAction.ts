import {BaseBackendMessageAction} from "../BaseBackendMessageAction";
import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {DeleteMessage} from "../../../../shared/messages/DeleteMessage";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {AuthorisedMessageAction} from "../AuthorisedMessageAction";
import {ListMessageAction} from "./ListMessageAction";
import {TableSettings} from "../../database/TableSettings";
import {BasePublicTable} from "../../../../shared/BasePublicTable";

export class DeleteMessageAction extends AuthorisedMessageAction<DeleteMessage> {
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const publicTableClass = await ListMessageAction.getPublicTableClassFromMessage(this.data)
		const publicObj = new publicTableClass
		const tableClass = await ListMessageAction.getTableClass(publicTableClass)
		const obj = new tableClass
		
		const settings = obj.getSettings() as TableSettings<BasePublicTable>
		const where = `${publicObj.getPrimaryKey().toString()} = ${this.data.id}`
		
		const response = db.delete(tableClass, settings?.getWhere(session, where) ?? where, 1)
		
		session.send(new ConfirmResponseMessage(this.data, response == 1))
	}
}
