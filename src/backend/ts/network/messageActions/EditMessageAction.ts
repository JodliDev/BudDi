import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {EditMessage} from "../../../../shared/messages/EditMessage";
import {ListEntryResponseMessage} from "../../../../shared/messages/ListEntryResponseMessage";
import {BasePublicTable} from "../../../../shared/BasePublicTable";
import {SqlWhere} from "../../database/SqlWhere";
import {BaseListMessageAction} from "./BaseListMessageAction";

// noinspection JSUnusedGlobalSymbols
export class EditMessageAction extends BaseListMessageAction<EditMessage> {
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const values = await this.getValues()
		this.checkValues(this.data.values, values.publicObj, values.settings)
		
		values.settings.onBeforeEditList(this.data.values, db, session)
		const where = SqlWhere(values.tableClass).is(values.settings.primaryKey, this.data.id)
		
		let count = 0
		for(const _ in this.data.values) {
			++count
		}
		
		const response = count == 0 ? 1 : db.update(values.tableClass, {"=": this.data.values}, values.settings?.getWhere(session, where) ?? where, 1)
		
		const joinedResponse = db.selectJoinedTable(
			values.tableClass,
			{
				where: values.settings?.getWhere(session, where) ?? where,
				limit: 1
			}
		)
		session.send(new ListEntryResponseMessage<BasePublicTable>(this.data, response != 0 && joinedResponse.length != 0, joinedResponse[0]))
	}
	
}
