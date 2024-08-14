import {Class} from "../../../shared/Class";

export function column<T>(table: Class<T>, column: keyof T): string {
	return `${table.name}.${column.toString()}`
}
