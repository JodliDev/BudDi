import {SqlQueryGenerator} from "./SqlQueryGenerator";
import BetterSqlite3 from "better-sqlite3";
import {DatabaseInstructions} from "./DatabaseInstructions";
import {ColumnInfo} from "./ColumnInfo";
import {TableDefinition} from "./TableDefinition";
import {Class} from "../../../shared/Class";
import {Options} from "../Options";
import {DatabaseMigrationManager} from "./DatabaseMigrationManager";


const DB_NAME = "db.sqlite"

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
	
	public quickSelect<T extends TableDefinition>(table: Class<T>, where?: string, limit?: number, from?: number): T[] {
		return this.select(table, undefined, where, limit, from) as T[]
	}
	public select<T extends TableDefinition, JoinedT extends TableDefinition>(
		table: Class<T>,
		select?: string[],
		where?: string,
		limit?: number,
		from?: number,
		join?: { innerColumn: keyof T, joinedTable: Class<JoinedT>, joinedColumn: keyof JoinedT }
	): unknown[] {
		return this.unsafeSelect(
			table.name,
			select,
			where,
			limit,
			from,
			join
				? { innerColumn: join.innerColumn.toString(), joinedTableName: join.joinedTable.name, joinedColumn: join.joinedColumn.toString() }
				: undefined
		)
	}
	
	public unsafeSelect(
		tableName: string,
		select?: string[],
		where?: string,
		limit?: number,
		from?: number,
		join?: { innerColumn: string, joinedTableName: string, joinedColumn: string }
	) {
		const query = SqlQueryGenerator.createSelectSql(tableName, select, where, limit, from, join)
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
		return this.unsafeInsert(table.name, values)
	}
	public unsafeInsert<T extends TableDefinition>(tableName: string, values: Partial<T>): number | bigint {
		const query = SqlQueryGenerator.createInsertSql(tableName, values)
		const sqlValues = Object.values(values).map(value => SqlQueryGenerator.toSqlValue(value))
		
		const statement = this.db.prepare(query)
		const result = statement.run(Object.values(sqlValues))
		
		return result.changes > 0 ? result.lastInsertRowid : 0
	}
	
	public update<T extends TableDefinition>(table: Class<T>, values: Partial<T>, where: string, limit?: number) {
		return this.unsafeUpdate(table.name, values, where)
	}
	public unsafeUpdate<T extends TableDefinition>(tableName: string, values: Partial<T>, where: string, limit?: number) {
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
	public unsafeDelete<T extends TableDefinition>(tableName: string, where: string, limit?: number) {
		const query = SqlQueryGenerator.createDeleteSql(tableName, where, limit)
		
		const statement = this.db.prepare(query)
		return statement.run().changes
	}
	
	
}
