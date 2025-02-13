import {Class} from "../../../shared/Class";
import {column} from "./column";
import {ListFilterData, Operators} from "../../../shared/ListFilter";
import {FaultyInputException} from "../exceptions/FaultyInputException";
import {TableSettings} from "./TableSettings";
import {BackendTable} from "./DatabaseInstructions";

export interface SqlWhereData {
	getSql(): string
	getValues(): unknown[]
	getJoinedTables(): Class<BackendTable>[]
	isNotEmpty(): boolean
	getBuilder(): SqlWhereBuilder<BackendTable>
	concat(connector: "AND" | "OR", sqlWhere: SqlWhereData): ConnectorBuilder<BackendTable>
}

interface StatementBuilder<T extends BackendTable> extends SqlWhereData {
	is(columnName: keyof T, value: unknown): ConnectorBuilder<T>
	isCompared(operator: Operators, columnName: keyof T, value: unknown): ConnectorBuilder<T>
	isComparedFromOtherTable(operator: Operators, tableClass: Class<T>, columnName: keyof T, value: unknown): ConnectorBuilder<T>
}
interface ConnectorBuilder<T extends BackendTable> extends SqlWhereData {
	and(): StatementBuilder<T>
	or(): StatementBuilder<T>
	concat(connector: "AND" | "OR", sqlWhere: SqlWhereData): ConnectorBuilder<T>
}

export class SqlWhereBuilder<T extends BackendTable> implements StatementBuilder<T>, ConnectorBuilder<T> {
	private sql: string = ""
	private values: unknown[] = []
	private joinedTables: Class<BackendTable>[] = []
	
	constructor(private table: Class<T>) { }
	
	private valueToSql(value: unknown): unknown {
		switch(typeof value) {
			case "boolean":
				return value ? "1" : "0"
			default:
				return value
		}
	}
	
	public is(columnName: keyof T, value: unknown): ConnectorBuilder<T> {
		return this.isCompared("=", columnName, value)
	}
	public isCompared(operator: Operators, columnName: keyof T, value: unknown): ConnectorBuilder<T> {
		return this.isComparedFromOtherTable(operator, this.table, columnName, value)
	}
	
	public isComparedFromOtherTable<TOther extends BackendTable>(operator: Operators, tableClass: Class<TOther>, columnName: keyof TOther, value: unknown): ConnectorBuilder<T> {
		this.sql += `${column(tableClass, columnName)} ${operator} ?`
		this.values.push(this.valueToSql(value))
		if(tableClass.name != this.table.name && !this.joinedTables.find((t => t.name == tableClass.name)))
			this.joinedTables.push(tableClass)
		return this
	}
	public concat(connector: "AND" | "OR", sqlWhere: SqlWhereData): ConnectorBuilder<T> {
		this.sql = `(${this.sql}) ${connector} (${sqlWhere.getSql()})`
		this.values = this.values.concat(sqlWhere.getValues())
		this.joinedTables = this.joinedTables.concat(sqlWhere.getJoinedTables())
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
	public getJoinedTables(): Class<BackendTable>[] {
		return this.joinedTables
	}
	
	public getBuilder(): SqlWhereBuilder<BackendTable> {
		return this
	}
}

export function SqlWhere<T extends BackendTable>(table: Class<T>): SqlWhereBuilder<T> {
	return new SqlWhereBuilder(table)
}

export function SqlWhereFromFilter<T extends BackendTable>(table: Class<T>, settings: TableSettings<T>, filter: ListFilterData): SqlWhereData | undefined {
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
		
		const entryTable = settings.getAllowedColumnTable(entry.column)
		if(!entryTable)
			throw new FaultyInputException()
		
		builder.isComparedFromOtherTable(entry.operator, entryTable, entry.column as keyof BackendTable, entry.value)
		notFirstLoop = true
	}
	
	return builder
}
