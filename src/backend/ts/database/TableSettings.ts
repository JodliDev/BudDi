import {ForeignKeyInfo} from "./ForeignKeyInfo";
import {DatabaseManager} from "./DatabaseManager";
import {WebSocketSession} from "../network/WebSocketSession";
import {SqlDataTypes} from "./SqlQueryGenerator";
import {SqlWhereData} from "./SqlWhere";
import {Class} from "../../../shared/Class";
import {BackendTable} from "./DatabaseInstructions";

export class TableSettings<TableT extends BackendTable> {
	public readonly foreignKeys = {} as Record<keyof TableT, ForeignKeyInfo<any>>
	public hasForeignKeys: boolean = false
	public readonly dataTypes = {} as Record<keyof TableT, SqlDataTypes>
	public readonly floatValues = {} as Record<keyof TableT, boolean>
	public allowedFilterColumns = {} as Record<string, Class<BackendTable>>
	public onBeforeAddToList: (data: Partial<TableT>, db: DatabaseManager, session: WebSocketSession) => void = () => { }
	public onAfterAddToList: (data: Partial<TableT>, db: DatabaseManager, addedId: number | bigint) => void = () => { }
	public onBeforeEditList: (data: Partial<TableT>, db: DatabaseManager, session: WebSocketSession) => void = () => { }
	public onBeforeDeleteFromList: (id: number | bigint, db: DatabaseManager, session: WebSocketSession) => void = () => { }
	public onAfterDeleteFromList: (id: number | bigint, db: DatabaseManager, session: WebSocketSession) => void = () => { }
	private listFilter?: (session: WebSocketSession) => SqlWhereData = undefined
	
	constructor(public readonly primaryKey: keyof TableT) { }
	
	public getWhere(session: WebSocketSession, where?: SqlWhereData): SqlWhereData | undefined {
		if(this.listFilter && this.listFilter(session).isNotEmpty())
			return where ? this.listFilter(session).concat("AND", where) : this.listFilter(session)
		else
			return where
	}
	
	
	setForeignKey<ColumnT extends BackendTable>(column: keyof TableT, info: Pick<ForeignKeyInfo<ColumnT>, "table" | "to" | "isPublic" | "on_delete" | "on_update">): void {
		this.foreignKeys[column] = {from: column.toString(), ...info}
		this.hasForeignKeys = true
	}
	
	setOnBeforeDelete(onDelete: (id: number | bigint, db: DatabaseManager, session: WebSocketSession) => void): void {
		this.onBeforeDeleteFromList = onDelete
	}
	setOnAfterDelete(onDelete: (id: number | bigint, db: DatabaseManager, session: WebSocketSession) => void): void {
		this.onAfterDeleteFromList = onDelete
	}
	setOnBeforeEdit(onEdit: (data: Partial<TableT>, db: DatabaseManager, session: WebSocketSession) => void): void {
		this.onBeforeEditList = onEdit
	}
	
	setOnBeforeAdd(onAdd: (data: Partial<TableT>, db: DatabaseManager, session: WebSocketSession) => void): void {
		this.onBeforeAddToList = onAdd
	}
	setOnAfterAdd(onAdd: (data: Partial<TableT>, db: DatabaseManager, userId: number | bigint) => void): void {
		this.onAfterAddToList = onAdd
	}
	
	/**
	 * Adds where conditions whenever the table is used in {@Link ListMessageAction} / {@link ListWidget}
	 * @param listFilter
	 */
	setListFilter(listFilter: (session: WebSocketSession) => SqlWhereData): void {
		this.listFilter = listFilter
	}
	
	setAllowedFilterColumn<T extends BackendTable>(tableClass: Class<T>, column: keyof T): void {
		this.allowedFilterColumns[column.toString()] = tableClass
	}
	
	/**
	 * Will usually be used when a data type can not be detected (usually when it is null, or we need a blob).
	 * @param column column name.
	 * @param type string definition of the type.
	 */
	setDataType(column: keyof TableT, type: SqlDataTypes): void {
		this.dataTypes[column] = type
	}
	setFloatValues(... keys: (keyof TableT)[]): void {
		for(const key of keys) {
			this.floatValues[key] = true
		}
	}
	
	public getAllowedColumnTable(columnName: string): Class<BackendTable> | undefined {
		return this.allowedFilterColumns[columnName]
	}
}
