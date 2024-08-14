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
		const publicListClass = await ListMessageAction.getPublicListClass(this.data)
		const publicList = new publicListClass
		const listClass = await ListMessageAction.getListClass(this.data, publicList)
		const list = new listClass
		const tableName = publicList.getTableName()
		
		ListMessageAction.checkValues(this.data.values, publicList)
		
		const settings = list.getSettings && list.getSettings()
		settings?.onAdd && settings?.onAdd(this.data.values, db, session.userId!)
		
		const response = db.insert(listClass, this.data.values)
		
		const entry = db.publicTableSelect(listClass, publicList, `${publicList.getPrimaryKey().toString()} = ${response}`, 1)
		session.send(new ListEntryResponseMessage<BaseListEntry>(this.data, response != 0 && entry.length != 0, entry[0] as BaseListEntry))
		
	}
	
}
