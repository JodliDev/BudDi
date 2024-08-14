import {ListMessage} from "../../../../shared/messages/ListMessage";
import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {BaseListEntry} from "../../../../shared/BaseListEntry";
import {ListResponseMessage} from "../../../../shared/messages/ListResponseMessage";
import {AuthorisedMessageAction} from "../AuthorisedMessageAction";
import {Convenience} from "../../Convenience";
import {BaseListMessage} from "../../../../shared/BaseListMessage";
import {FaultyListException} from "../../exceptions/FaultyListException";
import {TableDefinition} from "../../database/TableDefinition";
import {Class} from "../../../../shared/Class";

export class ListMessageAction extends AuthorisedMessageAction<ListMessage> {
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const publicListClass = await ListMessageAction.getPublicListClass(this.data)
		const publicObj = new publicListClass
		const listClass = await ListMessageAction.getListClass(this.data, publicObj)
		const listObj = new listClass
		
		const tableName = publicObj.getTableName()
		const settings = listObj.getSettings && listObj.getSettings()
		
		const response = db.publicTableSelect(listClass, publicObj, settings?.getWhere(session.userId!), this.data.limit, this.data.from)
		const count = db.getCount(tableName)
		
		session.send(new ListResponseMessage(this.data, true, response as BaseListEntry[], publicObj.getPrimaryKey().toString(), count))
	}
	
	
	public static async getPublicListClass(data: BaseListMessage): Promise<Class<BaseListEntry>> {
		if(!Convenience.stringIsSafe(data.listName))
			throw new FaultyListException()
		const listClass = await import(`../../../../shared/lists/${data.listName}`);
		if(!listClass)
			throw new FaultyListException()
		
		const c = listClass[data.listName] as Class<BaseListEntry>
		if(!c)
			throw new FaultyListException()
		return c
	}
	
	public static async getListClass(data: BaseListMessage, publicObj: BaseListEntry): Promise<Class<TableDefinition>> {
		const tableName = publicObj.getTableName()
		const listClass = await import(`../../database/dataClasses/${tableName}`);
		if(!listClass)
			throw new FaultyListException()
		
		const c = listClass[tableName] as Class<TableDefinition>
		if(!c)
			throw new FaultyListException()
		return c
	}
	
	public static checkValues(values: Partial<BaseListEntry>, publicObj: BaseListEntry) {
		const primaryKey = publicObj.getPrimaryKey()
		for(const key in values) {
			if(!Object.prototype.hasOwnProperty.call(publicObj, key) || key == primaryKey)
				throw new FaultyListException()
		}
	}
}
