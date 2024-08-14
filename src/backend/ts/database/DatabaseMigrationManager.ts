import {DatabaseInstructions} from "./DatabaseInstructions";
import {SqlQueryGenerator} from "./SqlQueryGenerator";
import {ColumnInfo} from "./ColumnInfo";
import BetterSqlite3 from "better-sqlite3";
import {TableDefinition} from "./TableDefinition";
import {Class} from "../../../shared/Class";
import {ForeignKeyInfo} from "./ForeignKeyInfo";
import {TableStructure} from "./TableStructure";

interface TransferEntry {
	table: Class<TableDefinition>
	columns: string[]
	backupIdColumn: string
	newIdColumn?: string
}

export class DatabaseMigrationManager {
	private columnsToTransfer: TransferEntry[] = []
	private droppedTables: Record<string, boolean> = {}
	
	constructor(
		private readonly db: BetterSqlite3.Database,
		private readonly backupDb: BetterSqlite3.Database
	) { }
	
	public migrateTable(fromVersion: number, dbInstructions: DatabaseInstructions): void {
		console.log(`Migrating from version ${fromVersion} to ${dbInstructions.version}`)
		
		const db = this.db
		const tableStructure = new SqlQueryGenerator(dbInstructions)
		const tableExists = fromVersion != 0
		
		
		const transaction = db.transaction(() => {
			//Run pre migrations:
			const preMigrationData = dbInstructions.preMigration(fromVersion, dbInstructions.version)
			
			//Find changed foreign keys:
			if(tableExists)
				this.migrateForeignKeys(tableStructure)
			
			//(re)create tables if needed:
			const tableQuery = tableStructure.createTableSql()
			console.log(`New table definitions:\n${tableQuery}`)
			db.exec(tableQuery)
			
			//Run Table alterations:
			if(tableExists) {
				const additionalQuery = this.migrateColumns(dbInstructions.tables, tableStructure)
				if(additionalQuery) {
					console.log(`Table alterations:\n${additionalQuery}`)
					db.exec(additionalQuery)
				}
			}
			
			//Recreate data:
			this.moveDataFromBackup()
			
			//Run post migrations:
			dbInstructions.postMigration(fromVersion, dbInstructions.version, preMigrationData)
			
			//Update database version:
			db.pragma(`user_version = ${dbInstructions.version}`)
		})
		
		transaction()
	}
	
	
	private recreateTable(structure: TableStructure<any>) {
		const tableName = structure.table.name
		
		
		this.droppedTables[tableName] = true
		this.columnsToTransfer.push({
			table: structure.table,
			backupIdColumn: structure.primaryKey.toString(),
			columns: structure.columns.map(column => column.name)
		})
		const query = SqlQueryGenerator.getDropTableSql(tableName)
		this.db.exec(query)
		
		console.log(`Dropped table ${tableName}`)
	}
	
	private migrateForeignKeys(tableStructure: SqlQueryGenerator) {
		console.log("Migrating foreign keys...")
		
		for(const tableName in tableStructure.tables) {
			const structure = tableStructure.tables[tableName]
			const newForeignKeys = structure.foreignKeys
			
			const oldForeignKeys = this.db.pragma(`foreign_key_list(${tableName})`) as ForeignKeyInfo<TableDefinition>[]
			
			if(!newForeignKeys) {
				if(oldForeignKeys?.length)
					this.recreateTable(structure)
				
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
					|| (oldForeignKey.on_update != "NO ACTION" && oldForeignKey.on_update != newForeignKey.on_update)
					|| (oldForeignKey.on_delete != "NO ACTION" && oldForeignKey.on_delete != newForeignKey.on_delete)
				) {
					count = -1
					break
				}
			}
			
			if(count != oldForeignKeys.length)
				this.recreateTable(structure)
		}
	}
	
	private migrateColumns(tableDefinition: Class<TableDefinition>[], tableStructure: SqlQueryGenerator): string {
		let additionalQuery = ""
		for(const tableName in tableStructure.tables) {
			if(this.droppedTables[tableName])
				continue
			
			const newTableDefinition = tableStructure.tables[tableName]
			const table = newTableDefinition.table
			
			const oldColumnList = this.db.pragma(`table_info(${tableName})`) as ColumnInfo[]
			const oldPrimaryKey = this.getPrimaryKeyColumn(oldColumnList)
			
			const newColumnList = newTableDefinition.columns
			const newPrimaryKey = newTableDefinition.primaryKey
			
			for(const newColumn of newColumnList) {
				const oldColumn = oldColumnList.find(entry => entry.name == newColumn.name)
				
				if(oldColumn == undefined)
					additionalQuery += SqlQueryGenerator.createNewColumnSql(tableName, newColumn)
				else if(newColumn.type != oldColumn.type || newColumn.dflt_value != oldColumn.dflt_value) {
					additionalQuery += SqlQueryGenerator.modifyColumnSql(tableName, newColumn)
					this.columnsToTransfer.push({
						table: table,
						backupIdColumn: oldPrimaryKey,
						newIdColumn: newPrimaryKey.toString(),
						columns: [oldColumn.name]
					})
				}
			}
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
	
	
	private moveDataFromBackup() {
        for(const entry of this.columnsToTransfer) {
			console.log(`Copying columns from ${entry.table.name}: ${entry.columns.join(", ")}`)
            
            const selectSql = SqlQueryGenerator.createSelectSql(
				entry.table.name,
                [entry.backupIdColumn, ...entry.columns]
            )
			const statement = this.backupDb.prepare(selectSql)
			const oldData = statement.all() as any[]
			
			for(const data of oldData) {
				const values: Record<string, unknown> = {}
				for(const key of entry.columns) {
					values[key] = data[key]
				}
				const sqlValues = Object.values(values).map(value => SqlQueryGenerator.toSqlValue(value))
				let query: string
				let queryValues: unknown[] = []
				if(entry.newIdColumn) {
					query = SqlQueryGenerator.createUpdateSql(entry.table.name, values, `${entry.newIdColumn} = ?`)
					queryValues = [...Object.values(sqlValues), data[entry.backupIdColumn]]
				}
				else {
					query = SqlQueryGenerator.createInsertSql(entry.table.name, values)
					queryValues = Object.values(sqlValues)
				}				
				const statement = this.db.prepare(query)
				statement.run(queryValues)
			}
        }
	}
}
