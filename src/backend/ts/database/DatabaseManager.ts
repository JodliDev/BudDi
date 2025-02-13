import {SqlQueryGenerator} from "./SqlQueryGenerator";
import BetterSqlite3 from "better-sqlite3";
import {DatabaseInstructions} from "./DatabaseInstructions";
import {Class} from "../../../shared/Class";
import {Options} from "../Options";
import {DatabaseMigrationManager} from "./DatabaseMigrationManager";
import {BasePublicTable} from "../../../shared/BasePublicTable";
import {column} from "./column";
import {TableSettings} from "./TableSettings";
import {User} from "./dataClasses/User";
import {SqlWhereData} from "./SqlWhere";
import {FileDataStore} from "../FileDataStore";
import {JoinedResponseEntry} from "../../../shared/JoinedResponseEntry";


const DB_NAME = "db.sqlite"

export interface SelectOptions<T extends BasePublicTable, JoinedT extends BasePublicTable[]> {
	select?: (keyof T)[],
	joinArray?: JoinInstructionsArray<JoinedT>,
	where?: SqlWhereData,
	limit?: number,
	offset?: number,
	order?: (keyof T | string),
	orderType?: "ASC" | "DESC"
}

export interface SqlJoinData {
	joinedTableName: string
	on: string
}
export interface JoinData extends SqlJoinData {
	joinedTable: Class<BasePublicTable>
}

interface JoinInstructions<JoinedT extends BasePublicTable> {
	joinedTable: Class<JoinedT>,
	select: (keyof JoinedT)[]
}

/**
 * The result is ExternalJoinData[] but with different Generic types
 * Used so autocomplete offers the correct types
 */
type JoinInstructionsArray<JoinedT extends BasePublicTable[]> = {[K in keyof JoinedT]: JoinInstructions<JoinedT[K]>};

export type UpdateValues<T> = {
	"="?: Partial<T>,
	"-="?: Partial<T>,
	"+="?: Partial<T>
}


export class DatabaseManager {
	public readonly fileDataStore: FileDataStore
	private readonly db: BetterSqlite3.Database
	private readonly publicJoins: Record<string, JoinData[]> = {}
	private readonly publicSelects: Record<string, string[]> = {}
	private readonly fullPublicSelects: Record<string, string[]> = {}
	
	public static async access(dbInstructions: DatabaseInstructions, options: Options): Promise<DatabaseManager> {
		const manager = new DatabaseManager(options, dbInstructions)
		const db = manager.db
		const version = db.pragma("user_version", {simple: true}) as number
		if(dbInstructions.version != version) {
			const migrationManager = new DatabaseMigrationManager(db, dbInstructions)
			if(version == 0)
				migrationManager.createTables()
			else
				await migrationManager.migrateTables(version, options)
		}
		
		Options.serverSettings.registrationAllowed = manager.selectTable(User, {limit: 1}).length == 0
		return manager
	}
	
	private constructor(options: Options, dbInstructions: DatabaseInstructions) {
		const path = `${options.root}/${options.sqlite}`
		console.log(`Loading Database ${path}/${DB_NAME}`)
		this.db = new BetterSqlite3(`${path}/${DB_NAME}`)
		this.fileDataStore = new FileDataStore(options)
		
		this.fillPublicJoins(dbInstructions)
		this.fillPublicSelects(dbInstructions)
	}
	
	private fillPublicSelects(dbInstructions: DatabaseInstructions): void {
		for(const tableClass of dbInstructions.tables) {
			const publicJoinedClass = Object.getPrototypeOf(tableClass.prototype).constructor //we want the public class so we can skip private columns
			const joinedObj = new publicJoinedClass as BasePublicTable
			const columnNames = joinedObj.getColumnNames()
			this.publicSelects[tableClass.name] = columnNames
			this.fullPublicSelects[tableClass.name] = columnNames.map((columnName) => column(publicJoinedClass, columnName))
		}
	}
	
	private fillPublicJoins(dbInstructions: DatabaseInstructions): void {
		for(const tableClass of dbInstructions.tables) {
			const tableObj = new tableClass
			const settings = tableObj.getSettings() as TableSettings<BasePublicTable>
			const foreignKeys = settings?.foreignKeys
			
			const sqlJoinArray: JoinData[] = []
			
			for(const key in foreignKeys) {
				const foreignKey = foreignKeys[key as keyof BasePublicTable]
				if(!foreignKey.isPublic)
					continue
				
				sqlJoinArray.push({
					joinedTable: foreignKey.table,
					joinedTableName: foreignKey.table.name,
					on: `${column(tableClass, foreignKey.from as keyof BasePublicTable)} = ${column(foreignKey.table, foreignKey.to)}`
				})
			}
			this.publicJoins[tableClass.name] = sqlJoinArray
		}
	}
	
	
	private getSqlJoinData<T extends BasePublicTable>(
		listClass: Class<T>,
		settings: TableSettings<T>,
		joinedTables: Class<BasePublicTable>[]
	): SqlJoinData[] {
		const foreignKeys = settings?.foreignKeys
		const joinArray: SqlJoinData[] = []
		
		for(const joinedTable of joinedTables) {
			if(joinedTable.name == listClass.name)
				continue
			
			for(const key in foreignKeys) {
				const foreignKey = foreignKeys[key]
				if(foreignKey.table.name == joinedTable.name) {
					joinArray.push({
						joinedTableName: BasePublicTable.getName(foreignKey.table),
						on: `${column(listClass, foreignKey.from as keyof BasePublicTable)} = ${column(foreignKey.table, foreignKey.to)}`
					})
					break
				}
			}
		}
		
		return joinArray
	}
	
	private correctValues<T extends BasePublicTable>(
		table: Class<T>,
		values: Partial<T>[],
		newBoolean: (value: unknown) => any
	): Partial<T>[] {
		if(!values.length)
			return values
		
		const obj = new table
		const keys = values[0]
		for(const key in keys) {
			switch(typeof obj[key]) {
				case "boolean":
					values.forEach(entry => entry[key] = newBoolean(entry[key]))
			}
		}
		return values
	}
	public typesToJs<T extends BasePublicTable>(table: Class<T>, values: Partial<T>[]): Partial<T>[] {
		return this.correctValues(table, values, value => !!value)
	}
	public typesToSql<T extends BasePublicTable>(table: Class<T>, values: Partial<T>[]): Partial<T>[] {
		return this.correctValues(table, values, value => SqlQueryGenerator.booleanToSqlValue(value))
	}
	
	public selectTable<T extends BasePublicTable>(
		table: Class<T>,
		options: Pick<SelectOptions<T, T[]>, "where" | "limit" | "offset" | "order" | "orderType">
	): T[] {
		return this.typesToJs(table, this.unsafeSelect(BasePublicTable.getName(table), undefined, options.where, options.limit, options.offset, options.order?.toString(), options.orderType) as Partial<T>[]) as T[]
	}
	
	public selectJoinedTable<T extends BasePublicTable, JoinedT extends BasePublicTable[]>(
		table: Class<T>,
		options: SelectOptions<T, JoinedT>
	): JoinedResponseEntry<T>[] {
		let selectWithTable = options.select ? options.select.map(entry => column(table, entry)) : this.fullPublicSelects[BasePublicTable.getName(table)]
		
		const tableName = BasePublicTable.getName(table)
		
		let joinSqlArray: SqlJoinData[]
		if(options.joinArray) {
			const joinTableIndex = this.publicJoins[tableName]
			joinSqlArray = []
			for(const join of options.joinArray) {
				const joinedTableName = BasePublicTable.getName(join.joinedTable)
				const entry = joinTableIndex.find((joinTable) => joinTable.joinedTableName == joinedTableName) //find cached joinEntry to use its "on"
				if(!entry)
					continue
				selectWithTable = selectWithTable.concat(join.select.map(entry => column(join.joinedTable, entry)))
				joinSqlArray.push({joinedTableName: joinedTableName, on: entry.on})
			}
		}
		else {
			joinSqlArray = this.publicJoins[tableName]
			
			//we add all the selects from the joins:
			for(const join of joinSqlArray) {
				const selects = this.fullPublicSelects[join.joinedTableName]
				selectWithTable = selectWithTable.concat(selects)
			}
		}
		
		const lines = this.unsafeSelect(
			BasePublicTable.getName(table),
			selectWithTable,
			options.where,
			options.limit,
			options.offset,
			options.order?.toString(),
			options.orderType,
			joinSqlArray
		) as Record<string, unknown>[]
		
		//sort data into response object:
		const response: JoinedResponseEntry<T>[] = []
		for(const line of lines) {
			const entry: Partial<T> = {}
			const joinedResult: Record<string, unknown> = {}
			
			
			for(const column of options.select ?? this.publicSelects[tableName]) {
				entry[column as keyof T] = line[column.toString()] as T[keyof T]
			}
			
			if(options.joinArray) {
				for(const join of options.joinArray) {
					const joined: Partial<BasePublicTable> = {}
					for(const selectEntry of join.select) {
						joined[selectEntry] = line[selectEntry.toString()] as any
					}
					joinedResult[BasePublicTable.getName(join.joinedTable)] = this.typesToJs(join.joinedTable, [joined])[0]
				}
			}
			else {
				for(const join of this.publicJoins[tableName]) {
					const joined: Partial<BasePublicTable> = {}
					for(const selectEntry of this.publicSelects[join.joinedTableName]) {
						joined[selectEntry as keyof BasePublicTable] = line[selectEntry.toString()] as any
					}
					joinedResult[join.joinedTableName] = this.typesToJs(join.joinedTable, [joined])[0]
				}
			}
			
            response.push({
				item: this.typesToJs(table, [entry])[0],
				joined: joinedResult
			})
		}
		return response
	}
	
	private unsafeSelect(
		tableName: string,
		select?: string[],
		where?: SqlWhereData,
		limit?: number,
		offset?: number,
		order?: string,
		orderType: "ASC" | "DESC" = "ASC",
		join?: SqlJoinData[]
	) {
		const query = SqlQueryGenerator.createSelectSql(tableName, select, where?.getSql(), limit, offset, order, orderType, join)
		const statement = this.db.prepare(query)
		return statement.all(...where?.getValues() ?? [])
	}
	
	public getCount<T extends BasePublicTable>(table: Class<T>, where?: SqlWhereData): number {
		return this.getInternalJoinedCount(table, where)
	}
	
	public getJoinedCount<T extends BasePublicTable>(table: Class<T>, where: SqlWhereData, settings: TableSettings<T>): number {
		const joinTables = where.getJoinedTables()
		return this.getInternalJoinedCount(table, where, joinTables?.length ? this.getSqlJoinData(table, settings, joinTables) : undefined)
	}
	private getInternalJoinedCount<T extends BasePublicTable>(table: Class<T>, where?: SqlWhereData, joinData?: SqlJoinData[]): number {
		const query = SqlQueryGenerator.createSelectSql(
			table.name,
			["COUNT(*)"],
			where?.getSql(),
			undefined,
			undefined,
			undefined,
			undefined,
			joinData
		)
		const statement = this.db.prepare(query)
		const result = statement.get(...where?.getValues() ?? []) as Record<string, number>
		return result["COUNT(*)"]
	}
	
	public insert<T extends BasePublicTable>(table: Class<T>, values: Partial<T>): number | bigint {
		return this.unsafeInsert(BasePublicTable.getName(table), this.typesToSql(table, [values])[0])
	}
	private unsafeInsert<T extends BasePublicTable>(tableName: string, values: Partial<T>): number | bigint {
		const query = SqlQueryGenerator.createInsertSql(tableName, values)
		const sqlValues = Object.values(values)
		
		const statement = this.db.prepare(query)
		const result = statement.run(Object.values(sqlValues))
		
		return result.changes > 0 ? result.lastInsertRowid : 0
	}
	
	public update<T extends BasePublicTable>(
		table: Class<T>,
		values: UpdateValues<T>,
		where: SqlWhereData,
		limit: number | undefined = 1
	) {
		for(const key in values) {
			const valueKey = key as keyof UpdateValues<T>
			if(values[valueKey])
				values[valueKey] = this.typesToSql(table, [values[valueKey]])[0]
		}
		
		return this.unsafeUpdate(BasePublicTable.getName(table), values, where, limit)
	}
	private unsafeUpdate<T extends BasePublicTable>(tableName: string, values: UpdateValues<T>, where: SqlWhereData, limit?: number) {
		const query = SqlQueryGenerator.createUpdateSql(tableName, values, where.getSql(), limit)
		
		const sqlValues: unknown[] = []
		for(const operator in values) {
			const subValues = values[operator as keyof UpdateValues<T>]
			for(const key in subValues) {
				sqlValues.push(subValues[key])
			}
		}
		
		const statement = this.db.prepare(query)
		return statement.run(Object.values(sqlValues).concat(...where.getValues())).changes
	}
	
	public delete<T extends BasePublicTable>(table: Class<T>, where: SqlWhereData, limit?: number) {
		return this.unsafeDelete(BasePublicTable.getName(table), where, limit)
	}
	private unsafeDelete(tableName: string, where: SqlWhereData, limit?: number) {
		const query = SqlQueryGenerator.createDeleteSql(tableName, where.getSql(), limit)
		const statement = this.db.prepare(query)
		return statement.run(...where.getValues()).changes
	}
}
