import {DatabaseManager} from "../../database/DatabaseManager";
import {BasePublicTable} from "../../../../shared/BasePublicTable";
import {LoggedInMessageAction} from "../LoggedInMessageAction";
import {BaseListMessage} from "../../../../shared/BaseListMessage";
import {FaultyListException} from "../../exceptions/FaultyListException";
import {Class} from "../../../../shared/Class";
import {TableSettings} from "../../database/TableSettings";
import {FaultyInputException} from "../../exceptions/FaultyInputException";

interface ListValues {
	tableClass: Class<BasePublicTable>
	publicObj: BasePublicTable
	settings: TableSettings<BasePublicTable>
}

export abstract class BaseListMessageAction<T extends BaseListMessage> extends LoggedInMessageAction<T> {
	protected async getValues(): Promise<ListValues> {
		const publicTableClass = await this.getPublicTableClassFromMessage(this.data)
		const publicObj = new publicTableClass
		const tableClass = await this.getTableClass(publicTableClass)
		const obj = new tableClass
		
		const settings = obj.getSettings() as TableSettings<BasePublicTable>
		
		return {
			tableClass: tableClass,
			publicObj: publicObj,
			settings: settings
		}
	}
	
	protected checkValues(values: Partial<BasePublicTable>, publicObj: BasePublicTable) {
		const primaryKey = publicObj.getPrimaryKey()
		if(Object.prototype.hasOwnProperty.call(publicObj, primaryKey))
			delete values[primaryKey as keyof BasePublicTable]
		for(const key in values) {
			if(!Object.prototype.hasOwnProperty.call(publicObj, key))
				throw new FaultyInputException()
		}
	}
	
	private async getPublicTableClassFromMessage(data: BaseListMessage): Promise<Class<BasePublicTable>> {
		if(!this.stringIsSafe(data.listName))
			throw new FaultyListException()
		return DatabaseManager.getPublicTableClass(data.listName)
	}
	
	private async getTableClass(publicTableClass: Class<BasePublicTable>): Promise<Class<BasePublicTable>> {
		const tableName = BasePublicTable.getName(publicTableClass)
		const tableClass = await require(`../../database/dataClasses/${tableName}`);
		if(!tableClass)
			throw new FaultyListException()
		
		const c = tableClass[tableName] as Class<BasePublicTable>
		if(!c)
			throw new FaultyListException()
		return c
	}
}
