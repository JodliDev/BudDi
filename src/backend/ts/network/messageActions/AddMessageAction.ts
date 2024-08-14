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

export class AddMessageAction extends AuthorisedMessageAction<AddMessage> {
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		if(!Convenience.stringIsSafe(this.data.listName))
			session.send(new ConfirmResponseMessage(this.data, false))
		
		const publicListClass = await import(`../../../../shared/lists/${this.data.listName}`);
		if(!publicListClass)
			session.send(new ConfirmResponseMessage(this.data, false))
		const publicObj = new publicListClass[this.data.listName]
		if(!publicObj)
			session.send(new ConfirmResponseMessage(this.data, false))
		
		const tableName = publicObj.getTableName()
		
		const listClass = await import(`../../database/dataClasses/${tableName}`);
		if(!listClass)
			session.send(new ConfirmResponseMessage(this.data, false))
		const obj = new listClass[tableName] as TableDefinition
		if(!obj)
			session.send(new ConfirmResponseMessage(this.data, false))
		
		
		//make sure no illegal values are passed:
		const primaryKey = publicObj.getPrimaryKey()
		for(const key in this.data.values) {
			if(!Object.prototype.hasOwnProperty.call(publicObj, key) || key == primaryKey) {
				session.send(new ConfirmResponseMessage(this.data, false))
				return
			}
		}
		
		const settings = obj.getSettings && obj.getSettings()
		settings?.onAdd && settings?.onAdd(this.data.values, db, session.userId!)
		
		const response = db.unsafeInsert(tableName, this.data.values)
		
		session.send(new ConfirmResponseMessage(this.data, response != 0))
		
	}
	
}
