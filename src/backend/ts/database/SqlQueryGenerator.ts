import {DatabaseInstructions} from "./DatabaseInstructions";
import {ColumnInfo} from "./ColumnInfo";
import {ForeignKeyInfo} from "./ForeignKeyInfo";
import {Class} from "../../../shared/Class";
import {BasePublicTable} from "../../../shared/BasePublicTable";
import {TableSettings} from "./TableSettings";
import {UpdateValues} from "./DatabaseManager";

const MAX_LIMIT = 100

export interface TableStructure<T extends BasePublicTable> {
	table: Class<T>
	primaryKey: keyof T
	columns: ColumnInfo[]
	foreignKeys?: Record<keyof T, ForeignKeyInfo<any>>
}

export type SqlDataTypes = "string" | "number" | "boolean" | "blob"

export class SqlQueryGenerator {
	public readonly tables: Record<string, TableStructure<any>> = {}
	
	constructor(dbContext: DatabaseInstructions) {
		this.getExpectedStructure(dbContext.tables)
	}
	
	private getExpectedStructure(tables: Class<BasePublicTable>[]): void {
		for(const table of tables) {
			const obj = new table
			
			const tableSettings = obj.getSettings() as TableSettings<BasePublicTable>
			const primaryKey = obj.getPrimaryKey()
			if(!obj.hasOwnProperty(primaryKey)) {
				console.log(`Skipping table ${BasePublicTable.getName(table)} because it has no primary key (Could not find: "${primaryKey.toString()}")`)
				continue
			}
			
			this.tables[BasePublicTable.getName(table)] = {
				table: table,
				primaryKey: primaryKey,
				columns: this.getColumns(obj),
				foreignKeys: tableSettings?.hasForeignKeys ? tableSettings.foreignKeys : undefined
			}
		}
	}
	
	private getColumns(obj: BasePublicTable): ColumnInfo[] {
		const tableSettings = obj.getSettings() as TableSettings<BasePublicTable>
		const floatValues = tableSettings.floatValues
		const primaryKey = obj.getPrimaryKey()
		const columns: ColumnInfo[] = []
		for(const property in obj) {
			const propertyKey = property as keyof BasePublicTable
			const value = obj[propertyKey]
			const columnData = {
				name: property,
				pk: property == primaryKey ? 1 : 0
			} as ColumnInfo
			
			const type = tableSettings.dataTypes.hasOwnProperty(propertyKey) ? tableSettings.dataTypes[propertyKey] : typeof value
			// noinspection JSUnreachableSwitchBranches
			switch(type) {
				case "blob":
					columnData.type = "BLOB"
					columnData.dflt_value = "NULL"
					break
				case "string":
					columnData.type = "TEXT"
					columnData.dflt_value = value == null ? "NULL" : `"${value}"`
					break
				case "number":
					columnData.type = floatValues[propertyKey] ? "REAL" : "INTEGER"
					columnData.dflt_value = value == null ? "NULL" : value.toString()
					break
				case "boolean":
					columnData.type = "INTEGER"
					columnData.dflt_value = value == null ? "NULL" : (!!value ? "1" : "0")
					break
				case "function":
					continue
				default:
					console.log(`${BasePublicTable.getName(obj.constructor as Class<BasePublicTable>)}.${property} was skipped because its type is not supported (${typeof value})`)
					continue
			}
			
			columns.push(columnData)
		}
		return columns
	}
	
	
	public createStructureSql(): string {
		let query = ""
		for(const tableName in this.tables) {
			query += this.createTableSql(tableName)
		}
		
		return query
	}
	public createTableSql(tableName: string): string {
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
		
		return `CREATE TABLE IF NOT EXISTS ${tableName} (\n\t${queryLines.join(",\n\t")}\n);\n`
	}
	
	private static getForeignKeySql(foreignKey: string, foreignKeyInfo: ForeignKeyInfo<BasePublicTable>): string {
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
		return `DROP TABLE IF EXISTS ${tableName};`
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
		return `ALTER TABLE ${table} ADD ${SqlQueryGenerator.getColumnDefinitionSql(columnInfo)};`
	}
	public static createCopyColumnSql(table: string, oldColumnName: string, newColumnName: string): string {
		return `UPDATE ${table} SET ${newColumnName} = ${oldColumnName};`
	}
	public static createDropColumnSql(table: string, columnName: string): string {
		return `ALTER TABLE ${table} DROP COLUMN ${columnName};`
	}
	
	public static createSelectSql(
		tableName: string,
		select?: string[],
		where?: string,
		limit?: number,
		from?: number,
		order?: string,
		orderType: "ASC" | "DESC" = "ASC",
		joinArray?: { joinedTableName: string, on: string }[]
	): string {
		let query = `SELECT ${select ? select.join(",") : "*"} FROM ${tableName}`
		if(joinArray)
			query += joinArray
				.map(join =>` LEFT JOIN ${join.joinedTableName} ON ${join.on}`)
				.join("")
		if(where)
			query += ` WHERE ${where}`
		if(order)
			query += ` ORDER BY ${order} ${orderType}`
		if(from)
			query += ` FROM ${from}`
		if(limit)
			query += ` LIMIT ${Math.min(limit, MAX_LIMIT)}`
		
		return `${query};\n`
	}
	
	public static createInsertSql<T extends BasePublicTable>(tableName: string, values: Partial<T>): string {
		const keys = Object.keys(values)
		return `INSERT INTO ${tableName} (${keys}) VALUES (${keys.map(() => "?").join(",")});`
	}
	public static createUpdateSql<T extends BasePublicTable>(tableName: string, values: UpdateValues<T>, where?: string, limit?: number): string {
		const valuesQuery: string[] = []
		for(const operator in values) {
			let addFu: (key: string) => string
			switch(operator) {
				case "+=":
					addFu = key => `${key} = ${key} + ?`
					break
				case "-=":
					addFu = key => `${key} = ${key} - ?`
					break
				case "=":
				default:
					addFu = key => `${key} = ?`
					break
			}
			for(const key in values[operator as keyof UpdateValues<T>]) {
				valuesQuery.push(addFu(key))
			}
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
