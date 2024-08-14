import {ListMessage} from "../../../../shared/messages/ListMessage";
import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager, JoinedData, JoinedResponseEntry} from "../../database/DatabaseManager";
import {BaseListEntry} from "../../../../shared/BaseListEntry";
import {ListResponseEntry, ListResponseMessage} from "../../../../shared/messages/ListResponseMessage";
import {AuthorisedMessageAction} from "../AuthorisedMessageAction";
import {Convenience} from "../../Convenience";
import {BaseListMessage} from "../../../../shared/BaseListMessage";
import {FaultyListException} from "../../exceptions/FaultyListException";
import {TableDefinition} from "../../database/TableDefinition";
import {Class} from "../../../../shared/Class";
import {column} from "../../database/column";
import {TableSettings} from "../../database/TableSettings";

export class ListMessageAction extends AuthorisedMessageAction<ListMessage> {
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const publicListClass = await ListMessageAction.getPublicListClassFromMessage(this.data)
		const publicObj = new publicListClass
		const listClass = await ListMessageAction.getListClass(this.data, publicObj)
		const listObj = new listClass
		
		const tableName = publicObj.getTableName()
		const settings = listObj.getSettings && listObj.getSettings()
		
		// const response = db.publicTableSelect(listClass, publicObj, settings?.getWhere(session.userId!), this.data.limit, this.data.from)
		// const count = db.getCount(tableName)
		
		// session.send(new ListResponseMessage(this.data, true, response as BaseListEntry[], publicObj.getPrimaryKey().toString(), count))
		
		
		
		// const joinArray = settings ? await ListMessageAction.getJoinArray(listClass, settings) : []
		//
		// const joinedResponse = db.joinedSelect(
		// 	listClass,
		// 	publicObj.getColumnNames() as (keyof TableDefinition)[],
		// 	joinArray,
		// 	settings?.getWhere(session.userId!),
		// 	this.data.limit,
		// 	this.data.from
		// )
		
		const joinedResponse = await db.joinedSelectForPublicTable(
			listClass,
			publicObj.getColumnNames(),
			settings,
			settings?.getWhere(session.userId!),
			this.data.limit,
			this.data.from
		)
		
		
		session.send(new ListResponseMessage(
			this.data, 
			true,
			joinedResponse,
			publicObj.getPrimaryKey().toString(),
			db.getCount(tableName)
		))
		
		console.log(joinedResponse)
	}
	
	public static async getJoinArray<T extends TableDefinition>(
		listClass: Class<T>,
		settings: TableSettings<T>
	): Promise<JoinedData<TableDefinition>[]> {
		const foreignKeys = settings?.foreignKeys
		const joinArray: JoinedData<TableDefinition>[] = []
		for(const key in foreignKeys) {
			const entry = foreignKeys[key]
			if(!entry.isPublic)
				continue
			
			const joinedPublicClass = await ListMessageAction.getPublicListClass(BaseListEntry.getListClassName(entry.table.name))
			const joinedObj = new joinedPublicClass
			joinArray.push({
				joinedTable: entry.table,
				select: joinedObj.getColumnNames() as (keyof TableDefinition)[],
				on: `${column(listClass, entry.from as any)} = ${column(entry.table, entry.to.toString())}`
			})
		}
		return joinArray
	}
	
	
	public static async getPublicListClass(listName: string): Promise<Class<BaseListEntry>> {
		const listClass = await import(`../../../../shared/lists/${listName}`);
		if(!listClass)
			throw new FaultyListException()
		
		const c = listClass[listName] as Class<BaseListEntry>
		if(!c)
			throw new FaultyListException()
		return c
	}
	
	public static async getPublicListClassFromMessage(data: BaseListMessage): Promise<Class<BaseListEntry>> {
		if(!Convenience.stringIsSafe(data.listName))
			throw new FaultyListException()
		return ListMessageAction.getPublicListClass(data.listName)
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
