import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {AuthorisedMessageAction} from "../AuthorisedMessageAction";
import {ListMessageAction} from "./ListMessageAction";
import {EditMessage} from "../../../../shared/messages/EditMessage";
import {ListEntryResponseMessage} from "../../../../shared/messages/ListEntryResponseMessage";
import {BaseListEntry} from "../../../../shared/BaseListEntry";

export class EditMessageAction extends AuthorisedMessageAction<EditMessage> {
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const publicListClass = await ListMessageAction.getPublicListClassFromMessage(this.data)
		const publicObj = new publicListClass
		const listClass = await ListMessageAction.getListClass(this.data, publicObj)
		const listObj = new listClass
		
		ListMessageAction.checkValues(this.data.values, publicObj)
		
		const settings = listObj.getSettings && listObj.getSettings()
		settings?.onEdit(this.data.values, db, session.userId!)
		const where = `${publicObj.getPrimaryKey().toString()} = ${this.data.id}`
		
		const response = db.update(listClass, this.data.values, settings?.getWhere(session.userId!, where) ?? where, 1)
		
		
		
		const joinedResponse = await db.joinedSelectForPublicTable(
			listClass,
			publicObj.getColumnNames(),
			settings,
			settings?.getWhere(session.userId!, where) ?? where,
			1
		)
		session.send(new ListEntryResponseMessage<BaseListEntry>(this.data, response != 0 && joinedResponse.length != 0, joinedResponse[0]))
	}
	
}
