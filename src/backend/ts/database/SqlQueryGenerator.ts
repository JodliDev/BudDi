import {TableDefinition} from "./TableDefinition";
import {DatabaseInstructions} from "./DatabaseInstructions";
import {ColumnInfo} from "./ColumnInfo";
import {TableStructure} from "./TableStructure";
import {ForeignKeyInfo} from "./ForeignKeyInfo";
import {Class} from "../../../shared/Class";

const MAX_LIMIT = 100

export class SqlQueryGenerator {
	public readonly tables: Record<string, TableStructure<any>> = {}
	
	constructor(dbContext: DatabaseInstructions) {
		this.getExpectedStructure(dbContext.tables)
	}
	
	private getExpectedStructure(tables: Class<TableDefinition>[]): void {
		for(const table of tables) {
			const obj = new table
			
			const tableSettings = obj.getSettings ? obj.getSettings() : undefined
			const primaryKey = obj.getPrimaryKey()
			if(!obj.hasOwnProperty(primaryKey)) {
				console.log(`Skipping table ${table.name} because it has no primary key (Could not find: "${primaryKey.toString()}")`)
				continue
			}
			
			this.tables[table.name] = {
				table: table,
				primaryKey: primaryKey,
				columns: this.getColumns(obj, primaryKey.toString()),
				foreignKeys: tableSettings?.hasForeignKeys ? tableSettings.foreignKeys : undefined
			}
		}
	}
	
	private getColumns(obj: TableDefinition, primaryKey: string): ColumnInfo[] {
		const columns: ColumnInfo[] = []
		for(const property in obj) {
			const value = obj[property as keyof unknown]
			const columnData = {
				name: property,
				pk: property == primaryKey ? 1 : 0
			} as ColumnInfo
			
			switch(typeof value) {
				case "string":
					columnData.type = "TEXT"
					columnData.dflt_value = `"${value}"`
					break
				case "number":
					columnData.type = value == Math.round(value as number) ? "INTEGER" : "REAL"
					columnData.dflt_value = (value as number).toString()
					break
				case "boolean":
					columnData.type = "INTEGER"
					columnData.dflt_value = value ? "1" : "0"
					break
				case "function":
					continue
				default:
					console.log(`${obj.constructor.name}.${property} was skipped because its type is not supported (${typeof value})`)
					continue
			}
			
			columns.push(columnData)
		}
		return columns
	}
	
	
	public createTableSql(): string {
		let query = ""
		for(const tableName in this.tables) {
			const tables = this.tables[tableName]
			
			//columns:
			const queryLines = []
			for(const columnInfo of tables.columns) {
				let queryPart = SqlQueryGenerator.getColumnDefinitionSql(columnInfo)
				if(columnInfo.pk)
					queryPart += " PRIMARY KEY"
				queryLines.push(queryPart)
			}
			
			//foreign keys:
			if(tables.foreignKeys) {
				for(const foreignKey in tables.foreignKeys) {
					queryLines.push(SqlQueryGenerator.getForeignKeySql(foreignKey, tables.foreignKeys[foreignKey]))
				}
			}
			
			query += `CREATE TABLE IF NOT EXISTS ${tableName} (\n\t${queryLines.join(",\n\t")}\n);\n`
		}
		
		return query
	}
	
	private static getForeignKeySql(foreignKey: string, foreignKeyInfo: ForeignKeyInfo<any>): string {
		let query = `FOREIGN KEY (${foreignKey}) REFERENCES ${foreignKeyInfo.table.name} (${foreignKeyInfo.to.toString()})`
		if(foreignKeyInfo.on_update)
			query += ` ON UPDATE ${foreignKeyInfo.on_update}`
		if(foreignKeyInfo.on_delete)
			query += ` ON DELETE ${foreignKeyInfo.on_delete}`
		
		return query
	}
	private static getColumnDefinitionSql(columnInfo: ColumnInfo): string {
		return `${columnInfo.name} ${columnInfo.type} DEFAULT ${columnInfo.dflt_value}`
	}
	
	public static getDropTableSql(tableName: string) {
		return `DROP TABLE IF EXISTS ${tableName};\n`
	}
	
	public static toSqlValue(value: unknown): string | number | null {
		switch(typeof value) {
			case "boolean":
				return this.booleanToSqlValue(value)
            case "number":
			case "string":
				return value
			default:
				return null
		}
	}
	public static booleanToSqlValue(value: unknown): number {
		return value ? 1 : 0
	}
	
	public static createNewColumnSql(table: string, columnInfo: ColumnInfo): string {
		return `ALTER TABLE ${table} ADD ${SqlQueryGenerator.getColumnDefinitionSql(columnInfo)};\n`
	}
	public static modifyColumnSql(table: string, columnInfo: ColumnInfo): string {
		return `ALTER TABLE ${table} DROP COLUMN ${columnInfo.name}; ${SqlQueryGenerator.createNewColumnSql(table, columnInfo)}`
	}
	
	public static createSelectSql(
		tableName: string,
		select?: string[],
		where?: string,
		limit?: number,
		from?: number,
		joinArray?: { joinedTableName: string, on: string }[]
	): string {
		let query = `SELECT ${select ? select.join(",") : "*"} FROM ${tableName}`
		if(joinArray)
			query += joinArray
				.map(join =>` JOIN ${join.joinedTableName} ON ${join.on}`)
				.join("")
		if(where)
			query += ` WHERE ${where}`
		if(from)
			query += ` FROM ${from}`
		if(limit)
			query += ` LIMIT ${Math.min(limit, MAX_LIMIT)}`
		
		return `${query};\n`
	}
	
	public static createInsertSql<T extends TableDefinition>(tableName: string, values: Partial<T>): string {
		const keys = Object.keys(values)
		return `INSERT INTO ${tableName} (${keys}) VALUES (${keys.map(() => "?").join(",")});`
	}
	public static createUpdateSql<T extends TableDefinition>(tableName: string, values: Partial<T>, where?: string, limit?: number): string {
		let valuesQuery: string[] = []
		for(let key in values) {
			valuesQuery.push(`${key} = ?`)
		}
		let query = `UPDATE ${tableName} SET ${valuesQuery.join(",")}`
		if(where)
			query += ` WHERE ${where}`
		if(limit)
			query += ` LIMIT ${limit}`
		
		return `${query};\n`
	}
	
	public static createDeleteSql(tableName: string, where?: string, limit?: number): string {
		let query =  `DELETE FROM ${tableName}`
		if(where)
			query += ` WHERE ${where}`
		if(limit)
			query += ` LIMIT ${limit}`
		
		return `${query};\n`
	}
}
