import {Class} from "../../../shared/Class";
import {BasePublicTable} from "../../../shared/BasePublicTable";

export function column<T extends BasePublicTable>(table: Class<T>, column: keyof T): string {
	return `${BasePublicTable.getName(table)}.${column.toString()}`
}
