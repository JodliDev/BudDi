import {Class} from "../../../shared/Class";
import {BasePublicTable} from "../../../shared/BasePublicTable";

export type ForeignKeyActions = "SET NULL" | "SET DEFAULT" | "RESTRICT" | "NO ACTION" | "CASCADE"

export interface ForeignKeyInfo<T extends BasePublicTable> {
	table: Class<T>,
	from: string,
	to: keyof T,
	isPublic?: boolean
	on_update?: ForeignKeyActions
	on_delete?: ForeignKeyActions
}
