import {Class} from "../../../shared/Class";
import {BasePublicTable} from "../../../shared/BasePublicTable";
import {BackendTable} from "./DatabaseInstructions";

export function column<T extends BackendTable | BasePublicTable>(table: Class<T>, column: keyof T, noTableName: boolean = false): string {
	if(noTableName)
		return column.toString()
	return `${table.name}.${column.toString()}`
}
