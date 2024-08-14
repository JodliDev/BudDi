import {SqlQueryGenerator} from "./SqlQueryGenerator";
import BetterSqlite3 from "better-sqlite3";
import {DatabaseInstructions} from "./DatabaseInstructions";
import {ColumnInfo} from "./ColumnInfo";
import {TableDefinition} from "./TableDefinition";
import {Class} from "../../../shared/Class";
import {Options} from "../Options";
import {DatabaseMigrationManager} from "./DatabaseMigrationManager";
import {BaseListEntry} from "../../../shared/BaseListEntry";
import {column} from "./column";


const DB_NAME = "db.sqlite"

interface JoinedData<JoinedT extends TableDefinition> {
	joinedTable: Class<JoinedT>,
	on: string,
	select: (keyof JoinedT)[]
}
type MapToJoinedDataArray<JoinedT extends TableDefinition[]> = { [K in keyof JoinedT]: JoinedData<JoinedT[K]> };
type MapToPartial<JoinedT extends TableDefinition[]> = { [K in keyof JoinedT]: Partial<JoinedT[K]> };

interface JoinedResponseEntry<T extends TableDefinition, JoinedT extends TableDefinition[]> {
	entry: Partial<T>,
	joined: MapToPartial<JoinedT>
}


export class DatabaseManager {
	private readonly db: BetterSqlite3.Database
	
	
	public static async access(dbInstructions: DatabaseInstructions, options: Options): Promise<DatabaseManager> {
		const manager = new DatabaseManager(options)
		const db = manager.db
		const version = db.pragma("user_version", { simple: true }) as number
		
		if(dbInstructions.version != version) {
			const backupPath = `${options.sqlite}${Date.now()}.sqlite`
			await db.backup(backupPath)
			const backupDb = new BetterSqlite3(`${backupPath}`)
			
			const migrationManager = new DatabaseMigrationManager(db, backupDb)
			migrationManager.migrateTable(version, dbInstructions)
		}
		
		return manager
	}
	
	private constructor(options: Options) {
		const path = options.sqlite
		console.log(`Loading Database ${path}${DB_NAME}`)
		this.db = new BetterSqlite3(`${path}${DB_NAME}`)
		
	}
	
	private correctValues<T extends TableDefinition>(
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
	public typesToJs<T extends TableDefinition>(table: Class<T>, values: Partial<T>[]): Partial<T>[] {
		return this.correctValues(table, values, value => !!value)
	}
	public typesToSql<T extends TableDefinition>(table: Class<T>, values: Partial<T>[]): Partial<T>[] {
		return this.correctValues(table, values, value => SqlQueryGenerator.booleanToSqlValue(value))
	}
	
	public publicTableSelect<TableT extends TableDefinition, ListT extends BaseListEntry>(
		table: Class<TableT>,
		publicListObj: ListT,
		where?: string,
		limit?: number,
		from?: number
	): Partial<TableT>[] {
		return this.typesToJs(table, this.unsafeSelect(table.name, publicListObj.getColumnNames(), where, limit, from) as Partial<TableT>[]) as Partial<TableT>[]
	}
	public tableSelect<T extends TableDefinition>(table: Class<T>, where?: string, limit?: number, from?: number): T[] {
		return this.typesToJs(table, this.unsafeSelect(table.name, undefined, where, limit, from) as Partial<T>[]) as T[]
	}
	
	
	
	
	public joinedSelect<T extends TableDefinition, JoinedT extends TableDefinition[]>(
		table: Class<T>,
		select: (keyof T)[],
		joinArray: MapToJoinedDataArray<JoinedT>,
		where?: string,
		limit?: number,
		from?: number
	): JoinedResponseEntry<T, JoinedT>[] {
		let selectWithTable = select.map(entry => column(table, entry))
		const joinSqlArray = []
		for(const join of joinArray) {
			selectWithTable = selectWithTable.concat(join.select.map(entry => column(join.joinedTable, entry)))
			joinSqlArray.push({ joinedTableName: join.joinedTable.name, on: join.on })
		}
		
		const lines = this.unsafeSelect(
			table.name,
			selectWithTable,
			where,
			limit,
			from,
			joinSqlArray
		) as Record<string, unknown>[]
		
		//sort data into response object:
		const response: JoinedResponseEntry<T, JoinedT>[] = []
		for(const line of lines) {
			const entry: Partial<T> = {}
			const joinedArray = [] as MapToPartial<JoinedT>
			
			for(const selectEntry of select) {
				entry[selectEntry] = line[selectEntry.toString()] as any
			}
			for(const join of joinArray) {
				const joined: Partial<T> = {}
				for(const selectEntry of join.select) {
					joined[selectEntry] = line[selectEntry.toString()] as any
				}
				joinedArray.push(joined)
			}
            response.push({entry: entry, joined: joinedArray})
		}
		return response
	}
	
	private unsafeSelect(
		tableName: string,
		select?: string[],
		where?: string,
		limit?: number,
		from?: number,
		join?: { joinedTableName: string, on: string }[]
	) {
		const query = SqlQueryGenerator.createSelectSql(tableName, select, where, limit, from, join)
		console.log(query)
		const statement = this.db.prepare(query)
		return statement.all()
	}
	
	public getCount(tableName: string, where?: string): number {
		const query = SqlQueryGenerator.createSelectSql(tableName, ["COUNT(*)"], where)
		const statement = this.db.prepare(query)
		const result = statement.get() as Record<string, number>
		return result["COUNT(*)"]
	}
	
	public insert<T extends TableDefinition>(table: Class<T>, values: Partial<T>): number | bigint {
		return this.unsafeInsert(table.name, this.typesToSql(table, [values])[0])
	}
	private unsafeInsert<T extends TableDefinition>(tableName: string, values: Partial<T>): number | bigint {
		const query = SqlQueryGenerator.createInsertSql(tableName, values)
		const sqlValues = Object.values(values)
		
		const statement = this.db.prepare(query)
		const result = statement.run(Object.values(sqlValues))
		
		return result.changes > 0 ? result.lastInsertRowid : 0
	}
	
	public update<T extends TableDefinition>(table: Class<T>, values: Partial<T>, where: string, limit?: number) {
		return this.unsafeUpdate(table.name, this.typesToSql(table, [values])[0], where, limit)
	}
	private unsafeUpdate<T extends TableDefinition>(tableName: string, values: Partial<T>, where: string, limit?: number) {
		const query = SqlQueryGenerator.createUpdateSql(tableName, values, where, limit)
		
		const sqlValues: unknown[] = []
		for(let key in values) {
			sqlValues.push(values[key])
		}
		
		const statement = this.db.prepare(query)
		return statement.run(Object.values(sqlValues)).changes
	}
	
	public delete<T extends TableDefinition>(table: Class<T>, where: string, limit?: number) {
		return this.unsafeDelete(table.name, where, limit)
	}
	private unsafeDelete<T extends TableDefinition>(tableName: string, where: string, limit?: number) {
		const query = SqlQueryGenerator.createDeleteSql(tableName, where, limit)
		
		const statement = this.db.prepare(query)
		return statement.run().changes
	}
}
