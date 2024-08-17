import {ListMessage} from "../../../../shared/messages/ListMessage";
import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager, JoinedData, JoinedResponseEntry} from "../../database/DatabaseManager";
import {BasePublicTable} from "../../../../shared/BasePublicTable";
import {ListResponseEntry, ListResponseMessage} from "../../../../shared/messages/ListResponseMessage";
import {AuthorisedMessageAction} from "../AuthorisedMessageAction";
import {Convenience} from "../../Convenience";
import {BaseListMessage} from "../../../../shared/BaseListMessage";
import {FaultyListException} from "../../exceptions/FaultyListException";
import {Class} from "../../../../shared/Class";
import {column} from "../../database/column";
import {TableSettings} from "../../database/TableSettings";

export class ListMessageAction extends AuthorisedMessageAction<ListMessage> {
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const publicTableClass = await ListMessageAction.getPublicTableClassFromMessage(this.data)
		const publicObj = new publicTableClass
		const tableClass = await ListMessageAction.getTableClass(publicTableClass)
		const obj = new tableClass
		
		const tableName = BasePublicTable.getName(publicTableClass)
		const settings = obj.getSettings() as TableSettings<BasePublicTable>
		
		const joinedResponse = await db.joinedSelectForPublicTable(
			tableClass,
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
			db.getCount(tableClass)
		))
	}
	
	public static async getJoinArray<T extends BasePublicTable>(
		listClass: Class<T>,
		settings: TableSettings<T>
	): Promise<JoinedData<BasePublicTable>[]> {
		const foreignKeys = settings?.foreignKeys
		const joinArray: JoinedData<BasePublicTable>[] = []
		for(const key in foreignKeys) {
			const foreignKey = foreignKeys[key]
			if(!foreignKey.isPublic)
				continue
			
			const joinedPublicClass = await ListMessageAction.getPublicTableClass(BasePublicTable.getName(foreignKey.table))
			const joinedObj = new joinedPublicClass
			joinArray.push({
				joinedTable: foreignKey.table,
				select: joinedObj.getColumnNames(),
				on: `${column(listClass, foreignKey.from as keyof T)} = ${column(foreignKey.table, foreignKey.to.toString())}`
			})
		}
		return joinArray
	}
	
	
	public static async getPublicTableClass(tableName: string): Promise<Class<BasePublicTable>> {
		const className = `Pub${tableName}`
		const tableClass = await import(`../../../../shared/public/${className}`);
		if(!tableClass)
			throw new FaultyListException()
		
		const c = tableClass[className] as Class<BasePublicTable>
		if(!c)
			throw new FaultyListException()
		return c
	}
	
	public static async getPublicTableClassFromMessage(data: BaseListMessage): Promise<Class<BasePublicTable>> {
		if(!Convenience.stringIsSafe(data.listName))
			throw new FaultyListException()
		return ListMessageAction.getPublicTableClass(data.listName)
	}
	
	public static async getTableClass(publicTableClass: Class<BasePublicTable>): Promise<Class<BasePublicTable>> {
		const tableName = BasePublicTable.getName(publicTableClass)
		const tableClass = await import(`../../database/dataClasses/${tableName}`);
		if(!tableClass)
			throw new FaultyListException()
		
		const c = tableClass[tableName] as Class<BasePublicTable>
		if(!c)
			throw new FaultyListException()
		return c
	}
	
	public static checkValues(values: Partial<BasePublicTable>, publicObj: BasePublicTable) {
		const primaryKey = publicObj.getPrimaryKey()
		for(const key in values) {
			if(!Object.prototype.hasOwnProperty.call(publicObj, key) || key == primaryKey)
				throw new FaultyListException()
		}
	}
}
