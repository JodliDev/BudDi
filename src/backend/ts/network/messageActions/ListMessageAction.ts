import {ListMessage} from "../../../../shared/messages/ListMessage";
import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager, JoinedData} from "../../database/DatabaseManager";
import {BasePublicTable} from "../../../../shared/BasePublicTable";
import {ListResponseMessage} from "../../../../shared/messages/ListResponseMessage";
import {LoggedInMessageAction} from "../LoggedInMessageAction";
import {Convenience} from "../../Convenience";
import {BaseListMessage} from "../../../../shared/BaseListMessage";
import {FaultyListException} from "../../exceptions/FaultyListException";
import {Class} from "../../../../shared/Class";
import {column} from "../../database/column";
import {TableSettings} from "../../database/TableSettings";

export class ListMessageAction extends LoggedInMessageAction<ListMessage> {
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const publicTableClass = await ListMessageAction.getPublicTableClassFromMessage(this.data)
		const publicObj = new publicTableClass
		const tableClass = await ListMessageAction.getTableClass(publicTableClass)
		const obj = new tableClass
		
		const settings = obj.getSettings() as TableSettings<BasePublicTable>
		
		const joinedResponse = await db.selectFullyJoinedPublicTable(
			tableClass,
			publicObj.getColumnNames(),
			settings,
			settings?.getWhere(session),
			this.data.limit,
			this.data.from,
			this.data.order as keyof BasePublicTable,
			this.data.orderType
		)
		
		session.send(new ListResponseMessage(
			this.data, 
			true,
			joinedResponse,
			publicObj.getPrimaryKey().toString(),
			db.getCount(tableClass, settings.getWhere(session))
		))
	}
	
	public static async getPublicJoinArray<T extends BasePublicTable>(
		listClass: Class<T>,
		settings: TableSettings<T>
	): Promise<JoinedData<BasePublicTable>[]> {
		const foreignKeys = settings?.foreignKeys
		const joinArray: JoinedData<BasePublicTable>[] = []
		for(const key in foreignKeys) {
			const foreignKey = foreignKeys[key]
			if(!foreignKey.isPublic)
				continue
			
			joinArray.push(await this.getJoinArray(
				listClass,
				foreignKey.table,
				foreignKey.from as keyof T,
				foreignKey.to
			))
		}
		return joinArray
	}
	
	public static async getJoinArray<T extends BasePublicTable, ForeignKeyT extends BasePublicTable>(
		listClass: Class<T>,
		foreignKeyTable: Class<ForeignKeyT>,
		on: keyof T,
		to: keyof ForeignKeyT
	): Promise<JoinedData<BasePublicTable>> {
		const joinedPublicClass = await ListMessageAction.getPublicTableClass(BasePublicTable.getName(foreignKeyTable))
		const joinedObj = new joinedPublicClass
		
		return {
			joinedTable: foreignKeyTable,
			select: joinedObj.getColumnNames(),
			on: `${column(listClass, on)} = ${column(foreignKeyTable, to)}`
		}
	}
	
	
	public static async getPublicTableClass(tableName: string): Promise<Class<BasePublicTable>> {
		const className = `Pub${tableName}`
		const tableClass = await require(`../../../../shared/public/${className}`);
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
		const tableClass = await require(`../../database/dataClasses/${tableName}`);
		if(!tableClass)
			throw new FaultyListException()
		
		const c = tableClass[tableName] as Class<BasePublicTable>
		if(!c)
			throw new FaultyListException()
		return c
	}
	
	public static checkValues(values: Partial<BasePublicTable>, publicObj: BasePublicTable) {
		const primaryKey = publicObj.getPrimaryKey()
		if(Object.prototype.hasOwnProperty.call(publicObj, primaryKey))
			delete values[primaryKey as keyof BasePublicTable]
		for(const key in values) {
			if(!Object.prototype.hasOwnProperty.call(publicObj, key))
				throw new FaultyListException()
		}
	}
}
