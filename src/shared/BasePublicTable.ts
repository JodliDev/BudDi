import {Class} from "./Class";

export abstract class BasePublicTable {
	public getColumnNames<T extends this>(): (keyof T)[] {
		const names: (keyof this)[] = []
		for(const key in this) {
			names.push(key as keyof this)
		}
		return names
	}
	
	abstract getPrimaryKey(): keyof any
	getSettings(): unknown {
		return undefined
	}
	
	public static getName(table: Class<BasePublicTable>): string {
		return table.name.startsWith("Pub") ? table.name.substring(3) : table.name
	}
}
