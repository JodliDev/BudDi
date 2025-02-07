import {DatabaseInstructions} from "./DatabaseInstructions";
import {SqlQueryGenerator, TableStructure} from "./SqlQueryGenerator";
import {ColumnInfo} from "./ColumnInfo";
import BetterSqlite3 from "better-sqlite3";
import {ForeignKeyInfo} from "./ForeignKeyInfo";
import {BasePublicTable} from "../../../shared/BasePublicTable";
import {Options} from "../Options";
import {Class} from "../../../shared/Class";

interface MigrationInstructions {
	oldTableName?: string,
	recreate: boolean
	
	/**
	 * Stores changes to column (0: name in database, last: current name in code)
	 */
	renamedColumns: string[][]
}

export class Migrations {
	private readonly migrationData: Record<string, MigrationInstructions> = {}
	
	private getEntry(newTable: Class<BasePublicTable>): MigrationInstructions {
		const newTableName = BasePublicTable.getName(newTable)
		if(!this.migrationData.hasOwnProperty(newTableName)) {
			this.migrationData[newTableName] = {
				recreate: false,
				renamedColumns: []
			}
		}
		return this.migrationData[newTableName]
	}
	
	public renameTable(oldTableName: string, newTable: Class<BasePublicTable>) {
		const entry = this.getEntry(newTable)
		entry.recreate = true
		if(!entry.oldTableName)
			entry.oldTableName = oldTableName
	}
	
	
	public recreateTable(newTable: Class<BasePublicTable>) {
		const entry = this.getEntry(newTable)
		entry.recreate = true
	}
	
	public renameColumn(table: Class<BasePublicTable>, oldColumn: string, newColumn: string): void {
		const entry = this.getEntry(table)
		const existingColumnEntry = entry.renamedColumns.find((entry) => entry[entry.length - 1] == oldColumn)
		
		if(existingColumnEntry)
			existingColumnEntry.push(newColumn)
		else
			entry.renamedColumns.push([oldColumn, newColumn])
	}
	
	public getMigrationData(): Record<string, MigrationInstructions> {
		return this.migrationData
	}
	
	public loopRenamedColumns(tableName: string, callback: (oldColumnName: string, newColumnName: string) => void): void {
		const migrationEntry = this.migrationData[tableName]
		
		//We have to assume that there were multiple version changes in which the column name was changed multiple times
		//So we only rename from the original name (index 0) to the newest (last index)
		for(const renamingArray of migrationEntry.renamedColumns) {
			if(renamingArray.length <= 1)
				continue
			const oldColumnName = renamingArray[0]
			const newColumnName = renamingArray[renamingArray.length - 1]
			
			callback(oldColumnName, newColumnName)
		}
	}
	
	public willBeRecreated(tableName: string): boolean {
		return this.migrationData[tableName]?.recreate
	}
}

export class DatabaseMigrationManager {
	private migrations = new Migrations()
	
	private readonly sqlGenerator: SqlQueryGenerator
	
	constructor(
		private readonly db: BetterSqlite3.Database,
		private readonly dbInstructions: DatabaseInstructions
	) { 
		this.sqlGenerator = new SqlQueryGenerator(this.dbInstructions)
	}
	
	
	public createTables(): void {
		const tableQuery = this.sqlGenerator.createStructureSql()
		console.log(`New table definitions:\n${tableQuery}`)
		this.db.exec(tableQuery)
	}
	
	public async migrateTables(fromVersion: number, options: Options): Promise<void> {
		if(fromVersion > this.dbInstructions.version)
			throw new Error(`Downgrading is not supported (from ${fromVersion} to ${this.dbInstructions.version})`)
		console.log(`Migrating from version ${fromVersion} to ${this.dbInstructions.version}`)
		
		const db = this.db
		
		//Create backup:
		const backupName = `from_${fromVersion}_to_${this.dbInstructions.version}`
		const backupPath = `${options.root}/${options.sqlite}/${backupName}.sqlite`
		await db.backup(backupPath)
		const backupDb = new BetterSqlite3(backupPath)
		
		const transaction = db.transaction(() => {
			//Disable foreign key constraints for now
			db.pragma("foreign_keys = OFF")
			
			//Run pre migrations:
			const dataForPostMigration = this.dbInstructions.preMigration(
				db,
				this.migrations,
				fromVersion,
				this.dbInstructions.version,
			)
			
			
			//Find changed foreign keys:
			this.migrateForeignKeys(this.sqlGenerator)
			
			
			//Run Table alterations:
			const additionalQuery = this.migrateColumns(this.sqlGenerator)
			if(additionalQuery) {
				console.log(`Table alterations:\n${additionalQuery}`)
				db.exec(additionalQuery)
			}
			
			//Rename columns. Needs to happen after migrateColumns()
			const renameQuery = this.renameColumns()
			if(renameQuery) {
				console.log(`Renamed columns:\n${renameQuery}`)
				db.exec(renameQuery)
			}
			
			//Drop tables that will be recreated:
			const migrationData = this.migrations.getMigrationData()
			for(const newTableName in migrationData) {
				const migrationEntry = migrationData[newTableName]
				if(!migrationEntry.recreate)
					continue
				const query = SqlQueryGenerator.getDropTableSql(migrationEntry.oldTableName ?? newTableName)
				console.log(`Dropping table ${migrationEntry.oldTableName} for recreation: ${query}`)
				const statement = this.db.prepare(query)
				statement.run()
			}
			
			//(re)create tables if needed:
			this.createTables()
			
			//Recreate data:
			this.migrateDataFromBackup(backupDb)
			
			//Run post migrations:
			this.dbInstructions.postMigration(db, fromVersion, this.dbInstructions.version, dataForPostMigration ?? {})
			
			//Update database version:
			db.pragma(`user_version = ${this.dbInstructions.version}`)
			
			//Enable foreign key constraints again
			db.pragma("foreign_keys = ON")
		})
		
		transaction()
	}
	
	private migrateForeignKeys(tableStructure: SqlQueryGenerator) {
		console.log("Migrating foreign keys...")
		
		for(const tableName in tableStructure.tables) {
			if(this.migrations.willBeRecreated(tableName))
				continue
			const structure = tableStructure.tables[tableName]
			const newForeignKeys = structure.foreignKeys
			
			const oldForeignKeys = this.db.pragma(`foreign_key_list(${tableName})`) as ForeignKeyInfo<BasePublicTable>[]
			
			if(!newForeignKeys) {
				if(oldForeignKeys?.length) {
					console.log(`Found missing foreign keys in ${tableName}!`)
					this.migrations.recreateTable(structure.table)
				}
				
				continue
			}
			
			let count = 0
			for(const _ in newForeignKeys) {
				++count
			}
			
			for(const oldForeignKey of oldForeignKeys) {
				const newForeignKey = newForeignKeys[oldForeignKey.from]
				
				if(!newForeignKey
					|| oldForeignKey.to != newForeignKey.to
					|| ((oldForeignKey.on_update ?? "NO ACTION") != (newForeignKey.on_update ?? "NO ACTION"))
					|| ((oldForeignKey.on_delete ?? "NO ACTION") != (newForeignKey.on_delete ?? "NO ACTION"))
				) {
					count = -1
					break
				}
			}
			
			if(count != oldForeignKeys.length) {
				console.log(`Found new foreign keys in ${tableName}!`)
				this.migrations.recreateTable(structure.table)
			}
		}
	}
	
	/**
	 * Checks all columns of all tables, creates them if they do not exist in the database and modifies them if needed.
	 * If types, default values or primary key change, the table is recreated
	 * @param tableStructure The table whose columns should be migrated.
	 */
	private migrateColumns(tableStructure: SqlQueryGenerator): string {
		let additionalQuery = ""
		for(const tableName in tableStructure.tables) {
			if(this.migrations.willBeRecreated(tableName))
				continue
			let additionalQueryForTable = ""
			
			const newTableDefinition = tableStructure.tables[tableName]
			
			const oldColumnList = this.db.pragma(`table_info(${tableName})`) as ColumnInfo[]
			if(!oldColumnList.length) {
				console.log(`Found new table ${tableName}`)
				continue
			}
			const oldPrimaryKey = this.getPrimaryKeyColumn(oldColumnList)
			
			const newColumnList = newTableDefinition.columns
			const newPrimaryKey = newTableDefinition.primaryKey
			
			if(oldPrimaryKey != newPrimaryKey) {
				this.migrations.recreateTable(newTableDefinition.table)
				continue
			}
			
			for(const newColumn of newColumnList) {
				const oldColumn = oldColumnList.find(entry => entry.name == newColumn.name)
				
				if(oldColumn == undefined)
					additionalQuery += SqlQueryGenerator.createNewColumnSql(tableName, newColumn)
				else if(newColumn.type != oldColumn.type || newColumn.dflt_value != oldColumn.dflt_value) {
					this.migrations.recreateTable(newTableDefinition.table)
					additionalQueryForTable = ""
					break
				}
			}
			
			additionalQuery += additionalQueryForTable
		}
		
		return additionalQuery
	}
	
	private getPrimaryKeyColumn(columnInfoList: ColumnInfo[]): string {
		for(const columnInfo of columnInfoList) {
			if(columnInfo.pk)
				return columnInfo.name
		}
		return ""
	}
	
	private renameColumns() {
		let renameQueries = ""
		
		const migrationData = this.migrations.getMigrationData()
		
		for(const tableName in migrationData) {
			if(migrationData[tableName].recreate)
				continue
			
			this.migrations.loopRenamedColumns(tableName, (oldColumnName, newColumnName) => {
				const copyQuery = SqlQueryGenerator.createCopyColumnSql(tableName, oldColumnName, newColumnName)
				const dropQuery = SqlQueryGenerator.createDropColumnSql(tableName, oldColumnName)

				renameQueries += `${copyQuery} ${dropQuery}\n`
			})
		}
		return renameQueries
	}
	
	private migrateDataFromBackup(backupDb: BetterSqlite3.Database) {
		//Loop tables in order
		const migrationData = this.migrations.getMigrationData()
		for(const table of this.dbInstructions.tables) {
			const newTableName = table.name
			if(!migrationData.hasOwnProperty(newTableName))
				continue
			
			const migrationEntry = migrationData[table.name]
			
			if(!migrationEntry.recreate)
				continue
			
			console.log(`***** Recreating data into ${newTableName}`)
			
			const oldColumnList = backupDb.pragma(`table_info(${migrationEntry.oldTableName})`) as ColumnInfo[]
			
			
			//load all data from table:
			const selectSql = SqlQueryGenerator.createSelectSql(
				migrationEntry.oldTableName ?? table.name,
				oldColumnList.map((columnInfo => columnInfo.name))
			)
			const statement = backupDb.prepare(selectSql)
			let data = statement.all() as any[]
			
			if(!data.length)
				continue
			
			this.migrations.loopRenamedColumns(table.name, (oldColumnName, newColumnName) => {
				for(const entry of data) {
					entry[newColumnName] = entry[oldColumnName]
					delete entry[oldColumnName]
				}
			})
			
			const query = SqlQueryGenerator.createInsertSql(newTableName, data[0]) //structure of entries are all the same
			
			//insert data into new db:
			for(const entry of data) {
				const queryValues = Object.values(entry)
				
				console.log(query, queryValues)
				const statement = this.db.prepare(query)
				statement.run(queryValues)
			}
		}
	}
}
