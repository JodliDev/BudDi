const start = "List".length

export abstract class BaseListEntry {
	public getTableName(): string {
		return this.constructor.name.substring(start)
	}
	public getColumnNames(): (keyof BaseListEntry)[] {
		const names: (keyof BaseListEntry)[] = []
		for(const key in this) {
			names.push(key as keyof BaseListEntry)
		}
		return names
	}
	
	abstract getPrimaryKey(): keyof any
}
