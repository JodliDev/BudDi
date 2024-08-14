import {TableDefinition} from "./TableDefinition";
import {Class} from "../../../shared/Class";

export type ForeignKeyActions = "SET NULL" | "SET DEFAULT" | "RESTRICT" | "NO ACTION" | "CASCADE"

export interface ForeignKeyInfo<T extends TableDefinition> {
	table: Class<T>,
	from: string,
	to: keyof T,
	isPublic?: boolean
	on_update?: ForeignKeyActions
	on_delete?: ForeignKeyActions
}
export function foreignKeys<TableT extends TableDefinition>(
	setForeignKey: <ColumnT extends TableDefinition>(column: keyof TableT, info: ForeignKeyInfo<ColumnT>) => void
) {
	
}
export function foreignKeyEntry<T extends TableDefinition>(info: ForeignKeyInfo<T>) {
	return info
}
