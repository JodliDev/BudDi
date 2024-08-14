import {ForeignKeyInfo} from "./ForeignKeyInfo";
import {TableDefinition} from "./TableDefinition";
import {DatabaseManager} from "./DatabaseManager";
import {BaseListEntry} from "../../../shared/BaseListEntry";

export class TableSettings<TableT> {
	public readonly foreignKeys: Record<keyof TableT, ForeignKeyInfo<any>> = {} as Record<keyof TableT, ForeignKeyInfo<any>>
	public hasForeignKeys: boolean = false
	public onAdd?: (data: Partial<TableT>, db: DatabaseManager, userId: number | bigint) => void = undefined
	
	
	setForeignKey<ColumnT extends TableDefinition>(column: keyof TableT, info: Pick<ForeignKeyInfo<ColumnT>, "table" | "to">) {
		this.foreignKeys[column] = { from: column.toString(), ...info }
		this.hasForeignKeys = true
	}
	
	setOnAdd(onAdd: (data: Partial<TableT>, db: DatabaseManager, userId: number | bigint) => void): void {
		this.onAdd = onAdd
	}
}
