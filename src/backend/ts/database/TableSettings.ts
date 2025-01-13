import {ForeignKeyInfo} from "./ForeignKeyInfo";
import {DatabaseManager} from "./DatabaseManager";
import {BasePublicTable} from "../../../shared/BasePublicTable";
import {WebSocketSession} from "../network/WebSocketSession";

export class TableSettings<TableT> {
	public readonly foreignKeys = {} as Record<keyof TableT, ForeignKeyInfo<any>>
	public readonly floatValues = {} as Record<keyof TableT, boolean>
	public hasForeignKeys: boolean = false
	public onBeforeAdd: (data: Partial<TableT>, db: DatabaseManager, session: WebSocketSession) => void = () => { }
	public onAfterAdd: (data: Partial<TableT>, db: DatabaseManager, addedId: number | bigint) => void = () => { }
	public onBeforeEdit: (data: Partial<TableT>, db: DatabaseManager, session: WebSocketSession) => void = () => { }
	public onBeforeDelete: (id: number | bigint, db: DatabaseManager, session: WebSocketSession) => void = () => { }
	public onAfterDelete: (id: number | bigint, db: DatabaseManager, session: WebSocketSession) => void = () => { }
	private listFilter?: (session: WebSocketSession) => string = undefined
	
	public getWhere(session: WebSocketSession, where?: string): string | undefined {
		if(this.listFilter)
			return where ? `${where} AND ${this.listFilter(session)}` : this.listFilter(session)
		else
			return where
	}
	
	
	setForeignKey<ColumnT extends BasePublicTable>(column: keyof TableT, info: Pick<ForeignKeyInfo<ColumnT>, "table" | "to" | "isPublic" | "on_delete" | "on_update">) {
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
	
	setListFilter(listFilter: (session: WebSocketSession) => string): void {
		this.listFilter = listFilter
	}
	
	setFloatValues(... keys: (keyof TableT)[]) {
		for(const key of keys) {
			this.floatValues[key] = true
		}
	}
}
