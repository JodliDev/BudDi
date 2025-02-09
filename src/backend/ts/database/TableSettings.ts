import {ForeignKeyInfo} from "./ForeignKeyInfo";
import {DatabaseManager} from "./DatabaseManager";
import {BasePublicTable} from "../../../shared/BasePublicTable";
import {WebSocketSession} from "../network/WebSocketSession";
import {SqlDataTypes} from "./SqlQueryGenerator";
import {SqlWhereData} from "./SqlWhere";

export class TableSettings<TableT extends BasePublicTable> {
	public readonly dataTypes = {} as Record<keyof TableT, SqlDataTypes>
	public readonly foreignKeys = {} as Record<keyof TableT, ForeignKeyInfo<any>>
	public readonly floatValues = {} as Record<keyof TableT, boolean>
	public allowedFilterColumns: (keyof TableT | string)[] = []
	public hasForeignKeys: boolean = false
	public onBeforeAdd: (data: Partial<TableT>, db: DatabaseManager, session: WebSocketSession) => void = () => { }
	public onAfterAdd: (data: Partial<TableT>, db: DatabaseManager, addedId: number | bigint) => void = () => { }
	public onBeforeEdit: (data: Partial<TableT>, db: DatabaseManager, session: WebSocketSession) => void = () => { }
	public onBeforeDelete: (id: number | bigint, db: DatabaseManager, session: WebSocketSession) => void = () => { }
	public onAfterDelete: (id: number | bigint, db: DatabaseManager, session: WebSocketSession) => void = () => { }
	private listFilter?: (session: WebSocketSession) => SqlWhereData = undefined
	
	public getWhere(session: WebSocketSession, where?: SqlWhereData): SqlWhereData | undefined {
		if(this.listFilter && this.listFilter(session).isNotEmpty())
			return where ? this.listFilter(session).concat("AND", where) : this.listFilter(session)
		else
			return where
	}
	
	
	setForeignKey<ColumnT extends BasePublicTable>(column: keyof TableT, info: Pick<ForeignKeyInfo<ColumnT>, "table" | "to" | "isPublic" | "on_delete" | "on_update">): void {
		this.foreignKeys[column] = { from: column.toString(), ...info }
		this.hasForeignKeys = true
	}
	
	setOnBeforeDelete(onDelete: (id: number | bigint, db: DatabaseManager, session: WebSocketSession) => void): void {
		this.onBeforeDelete = onDelete
	}
	setOnAfterDelete(onDelete: (id: number | bigint, db: DatabaseManager, session: WebSocketSession) => void): void {
		this.onAfterDelete = onDelete
	}
	setOnBeforeEdit(onEdit: (data: Partial<TableT>, db: DatabaseManager, session: WebSocketSession) => void): void {
		this.onBeforeEdit = onEdit
	}
	
	setOnBeforeAdd(onAdd: (data: Partial<TableT>, db: DatabaseManager, session: WebSocketSession) => void): void {
		this.onBeforeAdd = onAdd
	}
	setOnAfterAdd(onAdd: (data: Partial<TableT>, db: DatabaseManager, userId: number | bigint) => void): void {
		this.onAfterAdd = onAdd
	}
	
	/**
	 * Adds where conditions whenever the table is used  in {@Link ListMessageAction} / {@link ListWidget}
	 * @param listFilter
	 */
	setListFilter(listFilter: (session: WebSocketSession) => SqlWhereData): void {
		this.listFilter = listFilter
	}
	
	setAllowedFilterColumns(columns: (keyof TableT | string)[]): void {
		this.allowedFilterColumns = columns
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
	
	public isAllowedColumn(column: string): boolean {
		return this.allowedFilterColumns.indexOf(column) != -1
	}
}
