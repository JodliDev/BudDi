import {BasePublicTable} from "./BasePublicTable";

export type Operators = "=" | "<=" | ">=" | "<" | ">"

interface ListFilterEntry {
	column: string
	operator: Operators
	value: unknown
	isForeignKey?: boolean
}

export interface ListFilterData {
	values: ListFilterEntry[]
	combinator: "and" | "or"
	
	isSame(filter: ListFilterData): boolean
}

export class ListFilterBuilder<T extends BasePublicTable = BasePublicTable> implements ListFilterData {
	public readonly values: ListFilterEntry[] = []
	constructor(public readonly combinator: "and" | "or" = "and") { }
	
	public addRule(column: keyof T | string, operator: Operators, value: unknown, isForeignKey?: boolean): this {
		this.values.push({column: column.toString(), operator: operator, value: value, isForeignKey: isForeignKey})
		return this
	}
	public isSame(filter: ListFilterData): boolean {
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

export function ListFilter<T extends BasePublicTable = BasePublicTable>(combinator: "and" | "or" = "and") {
	return new ListFilterBuilder<T>(combinator)
}
