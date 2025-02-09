import {Class} from "../../../shared/Class";
import {BasePublicTable} from "../../../shared/BasePublicTable";
import {column} from "./column";
import {ListFilter, Operators} from "../../../shared/ListFilter";
import {FaultyInputException} from "../exceptions/FaultyInputException";
import {TableSettings} from "./TableSettings";

export interface SqlWhereData {
	getSql(): string
	getValues(): unknown[]
	isNotEmpty(): boolean
	getBuilder(): SqlWhereBuilder<BasePublicTable>
	concat(connector: "AND" | "OR", sqlWhere: SqlWhereData): ConnectorBuilder<BasePublicTable>
}

interface StatementBuilder<T extends BasePublicTable> extends SqlWhereData {
	is(columnName: keyof T, value: unknown): ConnectorBuilder<T>
	isCompared(operator: Operators, columnName: keyof T, value: unknown): ConnectorBuilder<T>
}
interface ConnectorBuilder<T extends BasePublicTable> extends SqlWhereData {
	and(): StatementBuilder<T>
	or(): StatementBuilder<T>
	concat(connector: "AND" | "OR", sqlWhere: SqlWhereData): ConnectorBuilder<T>
}

export class SqlWhereBuilder<T extends BasePublicTable> implements StatementBuilder<T>, ConnectorBuilder<T> {
	private sql: string = ""
	private values: unknown[] = []
	
	constructor(private table: Class<T>) { }
	
	public is(columnName: keyof T, value: unknown): ConnectorBuilder<T> {
		return this.isCompared("=", columnName, value)
	}
	public isCompared(operator: Operators, columnName: keyof T, value: unknown): ConnectorBuilder<T> {
		this.sql += ` ${column(this.table, columnName)} ${operator} ?`
		this.values.push(value)
		return this
	}
	public concat(connector: "AND" | "OR", sqlWhere: SqlWhereData): ConnectorBuilder<T> {
		this.sql = `(${this.sql}) ${connector} (${sqlWhere.getSql()})`
		this.values = this.values.concat(sqlWhere.getValues())
		return this
	}
	
	public and(): StatementBuilder<T> {
		this.sql += " AND "
		return this
	}
	public or(): StatementBuilder<T> {
		this.sql += " OR "
		return this
	}
	
	
	public isNotEmpty(): boolean {
		return this.sql !== ""
	}
	public getSql(): string {
		return this.sql
	}
	public getValues(): unknown[] {
		return this.values
	}
	
	public getBuilder(): SqlWhereBuilder<BasePublicTable> {
		return this
	}
}

export function SqlWhere<T extends BasePublicTable>(table: Class<T>): SqlWhereBuilder<T> {
	return new SqlWhereBuilder(table)
}

export function SqlWhereFromFilter<T extends BasePublicTable>(table: Class<T>, settings: TableSettings<T>, filter: ListFilter): SqlWhereData | undefined {
	if(!filter.values.length)
		return undefined
	const builder = new SqlWhereBuilder(table)
	const combinator = filter.combinator == "or" ? builder.or.bind(builder) : builder.and.bind(builder)
	
	let notFirstLoop = false
	for(const entry of filter.values) {
		if(notFirstLoop)
			combinator()
		
		switch(entry.operator) {
			case ">":
			case "<":
			case "=":
			case ">=":
			case "<=":
				break
			default:
				throw new FaultyInputException()
		}
		
		if(!settings.isAllowedColumn(entry.column))
			throw new FaultyInputException()
		builder.isCompared(entry.operator, entry.column as keyof T, entry.value)
		notFirstLoop = true
	}
	
	return builder
}
