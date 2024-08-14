import {ListSettings} from "./ListSettings";

const start = "List".length

export abstract class BaseListEntry {
	public getTableName(): string {
		return this.constructor.name.substring(start)
	}
	public getColumnNames(): string[] {
		const names = []
		for(const key in this) {
			names.push(key)
		}
		return names
	}
	
	abstract getPrimaryKey(): keyof any
}
