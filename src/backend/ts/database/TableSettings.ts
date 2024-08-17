import {ForeignKeyInfo} from "./ForeignKeyInfo";
import {DatabaseManager} from "./DatabaseManager";
import {BasePublicTable} from "../../../shared/BasePublicTable";

export class TableSettings<TableT> {
	public readonly foreignKeys = {} as Record<keyof TableT, ForeignKeyInfo<any>>
	public readonly floatValues = {} as Record<keyof TableT, boolean>
	public hasForeignKeys: boolean = false
	public onBeforeAdd: (data: Partial<TableT>, db: DatabaseManager, userId: number | bigint) => void = () => { }
	public onAfterAdd: (data: Partial<TableT>, db: DatabaseManager, userId: number | bigint) => void = () => { }
	public onEdit: (data: Partial<TableT>, db: DatabaseManager, userId: number | bigint) => void = () => { }
	private listFilter?: (userId: number | bigint) => string = undefined
	
	public getWhere(userId: number | bigint, where?: string): string | undefined {
		if(this.listFilter)
			return where ? `${where} AND ${this.listFilter(userId)}` : this.listFilter(userId)
		else
			return where
	}
	
	
	setForeignKey<ColumnT extends BasePublicTable>(column: keyof TableT, info: Pick<ForeignKeyInfo<ColumnT>, "table" | "to" | "isPublic" | "on_delete" | "on_update">) {
		this.foreignKeys[column] = { from: column.toString(), ...info }
		this.hasForeignKeys = true
	}
	
	setOnBeforeAdd(onAdd: (data: Partial<TableT>, db: DatabaseManager, userId: number | bigint) => void): void {
		this.onBeforeAdd = onAdd
	}
	setOnAfterAdd(onAdd: (data: Partial<TableT>, db: DatabaseManager, userId: number | bigint) => void): void {
		this.onAfterAdd = onAdd
	}
	
	setListFilter(listFilter: (userId: number | bigint) => string): void {
		this.listFilter = listFilter
	}
	
	setFloatValues(... keys: (keyof TableT)[]) {
		for(const key of keys) {
			this.floatValues[key] = true
		}
	}
}
