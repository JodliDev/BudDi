import {ColumnInfo} from "./ColumnInfo";
import {ForeignKeyInfo} from "./ForeignKeyInfo";
import {TableDefinition} from "./TableDefinition";
import {Class} from "../../../shared/Class";

export interface TableStructure<T extends TableDefinition> {
	table: Class<T>
	primaryKey: keyof T
	columns: ColumnInfo[]
	foreignKeys?: Record<keyof T, ForeignKeyInfo<any>>
}
