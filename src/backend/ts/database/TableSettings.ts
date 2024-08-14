import {ForeignKeyInfo} from "./ForeignKeyInfo";
import {TableDefinition} from "./TableDefinition";
import {DatabaseManager} from "./DatabaseManager";

export class TableSettings<TableT> {
	public readonly foreignKeys: Record<keyof TableT, ForeignKeyInfo<any>> = {} as Record<keyof TableT, ForeignKeyInfo<any>>
	public hasForeignKeys: boolean = false
	public onAdd: (data: Partial<TableT>, db: DatabaseManager, userId: number | bigint) => void = () => { }
	public onEdit: (data: Partial<TableT>, db: DatabaseManager, userId: number | bigint) => void = () => { }
	private listFilter?: (userId: number | bigint) => string = undefined
	
	public getWhere(userId: number | bigint, where?: string): string | undefined {
		if(this.listFilter)
			return where ? `${where} AND ${this.listFilter(userId)}` : this.listFilter(userId)
		else
			return where
	}
	
	
	setForeignKey<ColumnT extends TableDefinition>(column: keyof TableT, info: Pick<ForeignKeyInfo<ColumnT>, "table" | "to">) {
		this.foreignKeys[column] = { from: column.toString(), ...info }
		this.hasForeignKeys = true
	}
	
	setOnAdd(onAdd: (data: Partial<TableT>, db: DatabaseManager, userId: number | bigint) => void): void {
		this.onAdd = onAdd
	}
	
	setListFilter(listFilter: (userId: number | bigint) => string): void {
		this.listFilter = listFilter
	}
}
