import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {BasePublicTable} from "../../../../shared/BasePublicTable";
import {AddMessage} from "../../../../shared/messages/AddMessage";
import {ListEntryResponseMessage} from "../../../../shared/messages/ListEntryResponseMessage";
import {SqlWhere} from "../../database/SqlWhere";
import {BaseListMessageAction} from "./BaseListMessageAction";

// noinspection JSUnusedGlobalSymbols
export class AddMessageAction extends BaseListMessageAction<AddMessage> {
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const values = await this.getValues()
		this.checkValues(this.data.values, values.publicObj)
		
		this.checkValues(this.data.values, values.publicObj)
		
		values.settings?.onBeforeAdd(this.data.values, db, session)
		
		const response = db.insert(values.tableClass, this.data.values)
		const where = SqlWhere(values.tableClass).is(values.publicObj.getPrimaryKey() as keyof BasePublicTable, response)
		
		if(response != 0)
			values.settings?.onAfterAdd(this.data.values, db, response)
		
		
		const joinedResponse = await db.selectFullyJoinedPublicTable(
			values.tableClass,
			values.publicObj.getColumnNames(),
			values.settings,
			values.settings?.getWhere(session, where) ?? where,
			1
		)
		session.send(new ListEntryResponseMessage<BasePublicTable>(this.data, response != 0 && joinedResponse.length != 0, joinedResponse[0]))
	}
	
}
