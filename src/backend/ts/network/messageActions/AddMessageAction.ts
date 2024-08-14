import {BaseBackendMessageAction} from "../BaseBackendMessageAction";
import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {BaseListEntry} from "../../../../shared/BaseListEntry";
import {DeleteMessage} from "../../../../shared/messages/DeleteMessage";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {AddMessage} from "../../../../shared/messages/AddMessage";
import {TableDefinition} from "../../database/TableDefinition";
import {AuthorisedMessageAction} from "../AuthorisedMessageAction";
import {Convenience} from "../../Convenience";
import {ListMessageAction} from "./ListMessageAction";
import {ListEntryResponseMessage} from "../../../../shared/messages/ListEntryResponseMessage";

export class AddMessageAction extends AuthorisedMessageAction<AddMessage> {
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const publicListClass = await ListMessageAction.getPublicListClassFromMessage(this.data)
		const publicObj = new publicListClass
		const listClass = await ListMessageAction.getListClass(this.data, publicObj)
		const obj = new listClass
		
		ListMessageAction.checkValues(this.data.values, publicObj)
		
		const settings = obj.getSettings && obj.getSettings()
		settings?.onAdd(this.data.values, db, session.userId!)
		
		const response = db.insert(listClass, this.data.values)
		const where = `${publicObj.getPrimaryKey().toString()} = ${response}`
		
		
		
		
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
