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
		this.checkValues(this.data.values, values.publicObj, values.settings)
		
		values.settings.onBeforeAddToList(this.data.values, db, session)
		
		const response = db.insert(values.tableClass, this.data.values)
		const where = SqlWhere(values.tableClass).is(values.settings.primaryKey, response)
		
		if(response != 0)
			values.settings.onAfterAddToList(this.data.values, db, response)
		
		
		const joinedResponse = db.selectJoinedTable(
			values.tableClass,
			{
				where: values.settings.getWhere(session, where) ?? where,
				limit: 1
			}
		)
		session.send(new ListEntryResponseMessage<BasePublicTable>(this.data, response != 0 && joinedResponse.length != 0, joinedResponse[0]))
	}
	
}
