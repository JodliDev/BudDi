import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {AuthorisedMessageAction} from "../AuthorisedMessageAction";
import {ListMessageAction} from "./ListMessageAction";
import {EditMessage} from "../../../../shared/messages/EditMessage";
import {ListEntryResponseMessage} from "../../../../shared/messages/ListEntryResponseMessage";
import {BasePublicTable} from "../../../../shared/BasePublicTable";
import {TableSettings} from "../../database/TableSettings";

export class EditMessageAction extends AuthorisedMessageAction<EditMessage> {
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const publicTableClass = await ListMessageAction.getPublicTableClassFromMessage(this.data)
		const publicObj = new publicTableClass
		const tableClass = await ListMessageAction.getTableClass(publicTableClass)
		const obj = new tableClass
		
		ListMessageAction.checkValues(this.data.values, publicObj)
		
		const settings = obj.getSettings() as TableSettings<BasePublicTable>
		settings?.onBeforeEdit(this.data.values, db, session.userId!)
		const where = `${publicObj.getPrimaryKey().toString()} = ${this.data.id}`
		
		const response = db.update(tableClass, { "=": this.data.values }, settings?.getWhere(session.userId!, where) ?? where, 1)
		
		
		
		const joinedResponse = await db.joinedSelectForPublicTable(
			tableClass,
			publicObj.getColumnNames(),
			settings,
			settings?.getWhere(session.userId!, where) ?? where,
			1
		)
		session.send(new ListEntryResponseMessage<BasePublicTable>(this.data, response != 0 && joinedResponse.length != 0, joinedResponse[0]))
	}
	
}
