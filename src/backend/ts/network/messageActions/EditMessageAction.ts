import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {AuthorisedMessageAction} from "../AuthorisedMessageAction";
import {ListMessageAction} from "./ListMessageAction";
import {EditMessage} from "../../../../shared/messages/EditMessage";
import {ListEntryResponseMessage} from "../../../../shared/messages/ListEntryResponseMessage";
import {BaseListEntry} from "../../../../shared/BaseListEntry";

export class EditMessageAction extends AuthorisedMessageAction<EditMessage> {
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const publicObj = await ListMessageAction.getPublicListObj(this.data)
		const obj = await ListMessageAction.getListObj(this.data, publicObj)
		const tableName = publicObj.getTableName()
		
		ListMessageAction.checkValues(this.data.values, publicObj)
		
		const settings = obj.getSettings && obj.getSettings()
		settings?.onEdit && settings?.onEdit(this.data.values, db, session.userId!)
		
		const response = db.unsafeUpdate(tableName, this.data.values, `${publicObj.getPrimaryKey().toString()} = ${this.data.id}`, 1)
		
		const entry = db.unsafeSelect(tableName, Object.keys(publicObj), `${publicObj.getPrimaryKey().toString()} = ${this.data.id}`, 1)
		session.send(new ListEntryResponseMessage<BaseListEntry>(this.data, response != 0 && entry.length != 0, entry[0] as BaseListEntry))
		
	}
	
}
