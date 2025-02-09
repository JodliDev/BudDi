export type Operators = "=" | "<=" | ">=" | "<" | ">"

interface ListFilterEntry {
	column: string
	operator: Operators
	value: unknown
}

export class ListFilter {
	public readonly values: ListFilterEntry[] = []
	constructor(public readonly combinator: "and" | "or" = "and") { }
	
	public addRule(column: string, operator: Operators, value: unknown): void {
		this.values.push({column: column, operator: operator, value: value})
	}
	public isSame(filter: ListFilter): boolean {
		if(this.combinator != filter.combinator || this.values.length != filter.values.length)
			return false
		
		for(let i=0; i<this.values.length; ++i) {
			const current = this.values[i]
			const other = filter.values[i]
			if(current.value != other.value || current.column != other.column || current.operator != other.operator)
				return false
		}
		
		return true
	}
}
