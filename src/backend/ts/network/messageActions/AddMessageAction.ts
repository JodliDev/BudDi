import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {BasePublicTable} from "../../../../shared/BasePublicTable";
import {AddMessage} from "../../../../shared/messages/AddMessage";
import {LoggedInMessageAction} from "../LoggedInMessageAction";
import {ListMessageAction} from "./ListMessageAction";
import {ListEntryResponseMessage} from "../../../../shared/messages/ListEntryResponseMessage";
import {TableSettings} from "../../database/TableSettings";

export class AddMessageAction extends LoggedInMessageAction<AddMessage> {
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const publicListClass = await ListMessageAction.getPublicTableClassFromMessage(this.data)
		const publicObj = new publicListClass
		const listClass = await ListMessageAction.getTableClass(publicListClass)
		const obj = new listClass
		
		ListMessageAction.checkValues(this.data.values, publicObj)
		
		const settings = obj.getSettings() as TableSettings<BasePublicTable>
		settings?.onBeforeAdd(this.data.values, db, session)
		
		const response = db.insert(listClass, this.data.values)
		const where = `${publicObj.getPrimaryKey().toString()} = ${response}`
		
		if(response != 0)
			settings?.onAfterAdd(this.data.values, db, response)
		
		
		const joinedResponse = await db.joinedSelectForPublicTable(
			listClass,
			publicObj.getColumnNames(),
			settings,
			settings?.getWhere(session, where) ?? where,
			1
		)
		session.send(new ListEntryResponseMessage<BasePublicTable>(this.data, response != 0 && joinedResponse.length != 0, joinedResponse[0]))
	}
	
}
