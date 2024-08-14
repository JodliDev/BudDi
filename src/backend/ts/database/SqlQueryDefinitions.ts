import {TableDefinition} from "./TableDefinition";
import {Class} from "../../../shared/Class";

type Operator = "=" | "<" | ">" | "<=" | ">="

export class Where<T extends TableDefinition> {
	constructor(
		private column: keyof T,
		private value: unknown,
		private operator: Operator = "="
	) { }
	
	public toString(): string {
		return `${this.column.toString()} ${this.operator} ${this.value}`
	}
}

export class Join<InnerT, JoinedT> {
	constructor(
		private innerTable: Class<InnerT>,
		private innerColumn: keyof InnerT,
		private joinedTable: Class<JoinedT>,
		private joinedColumn: keyof JoinedT,
	) { }
	
	public toString(): string {
		return `JOIN ${this.joinedTable.name} ON ${this.joinedTable.name}.${this.joinedColumn.toString()} = ${this.innerTable.name}.${this.innerColumn.toString()}`
	}
}
