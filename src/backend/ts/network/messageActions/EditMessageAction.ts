import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {AuthorisedMessageAction} from "../AuthorisedMessageAction";
import {ListMessageAction} from "./ListMessageAction";
import {EditMessage} from "../../../../shared/messages/EditMessage";
import {ListEntryResponseMessage} from "../../../../shared/messages/ListEntryResponseMessage";
import {BaseListEntry} from "../../../../shared/BaseListEntry";
import {TableDefinition} from "../../database/TableDefinition";

export class EditMessageAction extends AuthorisedMessageAction<EditMessage> {
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const publicListClass = await ListMessageAction.getPublicListClass(this.data)
		const publicObj = new publicListClass
		const listClass = await ListMessageAction.getListClass(this.data, publicObj)
		const listObj = new listClass
		const tableName = publicObj.getTableName()
		
		ListMessageAction.checkValues(this.data.values, publicObj)
		
		const settings = listObj.getSettings && listObj.getSettings()
		settings?.onEdit && settings?.onEdit(this.data.values, db, session.userId!)
		
		const response = db.update(listClass, this.data.values, `${publicObj.getPrimaryKey().toString()} = ${this.data.id}`, 1)
		const entry = db.publicTableSelect(listClass, publicObj, `${publicObj.getPrimaryKey().toString()} = ${this.data.id}`, 1)
		session.send(new ListEntryResponseMessage<BaseListEntry>(this.data, response != 0 && entry.length != 0, entry[0] as BaseListEntry))
	}
	
}
