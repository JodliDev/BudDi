import {ListMessage} from "../../../../shared/messages/ListMessage";
import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {BaseListEntry} from "../../../../shared/BaseListEntry";
import {ListResponseMessage} from "../../../../shared/messages/ListResponseMessage";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {AuthorisedMessageAction} from "../AuthorisedMessageAction";
import {Convenience} from "../../Convenience";
import {ConfirmMessage} from "../../../../shared/messages/ConfirmMessage";
import {BaseListMessage} from "../../../../shared/BaseListMessage";
import {FaultyListException} from "../../exceptions/FaultyListException";
import {TableDefinition} from "../../database/TableDefinition";

export class ListMessageAction extends AuthorisedMessageAction<ListMessage> {
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const obj = await ListMessageAction.getPublicListObj(this.data)
		
		const tableName = obj.getTableName()
		
		const response = db.unsafeSelect(tableName, obj.getColumnNames(), undefined, this.data.limit, this.data.from)
		const count = db.getCount(tableName)
		
		session.send(new ListResponseMessage(this.data, true, response as BaseListEntry[], obj.getPrimaryKey().toString(), count))
	}
	
	
	public static async getPublicListObj(data: BaseListMessage): Promise<BaseListEntry> {
		if(!Convenience.stringIsSafe(data.listName))
			throw new FaultyListException()
		const listClass = await import(`../../../../shared/lists/${data.listName}`);
		if(!listClass)
			throw new FaultyListException()
		
		const obj = new listClass[data.listName] as BaseListEntry
		if(!obj)
			throw new FaultyListException()
		
		return obj
	}
	
	public static async getListObj(data: BaseListMessage, publicObj: BaseListEntry): Promise<TableDefinition> {
		const tableName = publicObj.getTableName()
		if(!Convenience.stringIsSafe(data.listName))
			throw new FaultyListException()
		const listClass = await import(`../../database/dataClasses/${tableName}`);
		if(!listClass)
			throw new FaultyListException()
		
		const obj = new listClass[tableName] as TableDefinition
		if(!obj)
			throw new FaultyListException()
		
		return obj
	}
	
	public static async checkValues(values: Partial<BaseListEntry>, publicObj: BaseListEntry) {
		const primaryKey = publicObj.getPrimaryKey()
		for(const key in values) {
			if(!Object.prototype.hasOwnProperty.call(publicObj, key) || key == primaryKey)
				throw new FaultyListException()
		}
	}
}
