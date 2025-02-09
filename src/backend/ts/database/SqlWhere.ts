import {Class} from "../../../shared/Class";
import {BasePublicTable} from "../../../shared/BasePublicTable";
import {column} from "./column";

export interface SqlWhereData {
	getSql(): string
	getValues(): unknown[]
	isNotEmpty(): boolean
	getBuilder(): SqlWhereBuilder<BasePublicTable>
	combine(connector: "AND" | "OR", sqlWhere: SqlWhereData): ConnectorBuilder<BasePublicTable>
}

interface StatementBuilder<T extends BasePublicTable> extends SqlWhereData {
	is(columnName: keyof T, value: unknown): ConnectorBuilder<T>
	isCompared(operator: "=" | "<=" | ">=" | "<" | ">", columnName: keyof T, value: unknown): ConnectorBuilder<T>
}
interface ConnectorBuilder<T extends BasePublicTable> extends SqlWhereData {
	and(): StatementBuilder<T>
	or(): StatementBuilder<T>
	combine(connector: "AND" | "OR", sqlWhere: SqlWhereData): ConnectorBuilder<T>
}

export class SqlWhereBuilder<T extends BasePublicTable> implements StatementBuilder<T>, ConnectorBuilder<T> {
	private sql: string = ""
	private values: unknown[] = []
	
	constructor(private table: Class<T>) { }
	
	public is(columnName: keyof T, value: unknown): ConnectorBuilder<T> {
		return this.isCompared("=", columnName, value)
	}
	public isCompared(operator: "=" | "<=" | ">=" | "<" | ">", columnName: keyof T, value: unknown): ConnectorBuilder<T> {
		this.sql += ` ${column(this.table, columnName)} ${operator} ?`
		this.values.push(value)
		return this
	}
	public combine(connector: "AND" | "OR", sqlWhere: SqlWhereData): ConnectorBuilder<T> {
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
