import {DatabaseInstructions} from "./DatabaseInstructions";
import {SqlQueryGenerator, TableStructure} from "./SqlQueryGenerator";
import {ColumnInfo} from "./ColumnInfo";
import BetterSqlite3 from "better-sqlite3";
import {ForeignKeyInfo} from "./ForeignKeyInfo";
import {BasePublicTable} from "../../../shared/BasePublicTable";
import {Options} from "../Options";

interface TransferEntry {
	backupTable: string,
	newTable: string,
	backupColumns: string[],
	newColumns: string[],
	backupIdColumn: string
	newIdColumn?: string
}

export interface PreMigrationData {
	/**
	 * A custom Record organised by version that can be used to transfer information to {@link postMigration}
	 */
	dataForPostMigration?: Record<number, unknown>
	
	/**
	 * Tables that will be renamed. Is usually empty and is meant to be filled by preMigration.
	 * Structure: { NewTableName: OldTableName }
	 */
	tablesForRenaming?: Record<string, string>,
	
	/**
	 * Columns that will be renamed. Is usually empty and is meant to be filled by preMigration
	 * Structure: { TableName: { NewColumnName: OldColumnName } }
	 */
	columnsForRenaming?: Record<string, Record<string, string>>,
	
	/**
	 * Table order in which migrations should be run. Tables that are not mentioned will run last
	 * Needed to prevent foreign key conflicts
	 */
	migrationTableOrder?: string[]
}

export class DatabaseMigrationManager {
	
	/**
	 * Tables that will be renamed. Is usually empty and is meant to be filled by preMigration.
	 * Structure: { NewTableName: OldTableName }
	 */
	private renamedTables: Record<string, string> = {};
	
	/**
	 * Columns that will be renamed. Is usually empty and is meant to be filled by preMigration
	 * Structure: { TableName: { NewColumnName: OldColumnName } }
	 */
	private renamedColumns: Record<string, Record<string, string>> = {};
	
	/**
	 * Table order in which migrations should be run. Tables that are not mentioned will run last
	 * Needed to prevent foreign key conflicts
	 */
	private migrationTableOrder: string[] = [];
	
	private columnsToTransfer: TransferEntry[] = []
	private droppedTables: Record<string, boolean> = {}
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
			throw new Error("Downgrading is not supported")
		console.log(`Migrating from version ${fromVersion} to ${this.dbInstructions.version}`)
		
		const db = this.db
		const databaseExists = fromVersion != 0
		
		//Create backup:
		const backupName = `from_${fromVersion}_to_${this.dbInstructions.version}`
		const backupPath = `${options.root}/${options.sqlite}/${backupName}.sqlite`
		await db.backup(backupPath)
		const backupDb = new BetterSqlite3(backupPath)
		
		const transaction = db.transaction(() => {
			//Run pre migrations:
			const preMigrationData = this.dbInstructions.preMigration(
				db,
				fromVersion,
				this.dbInstructions.version
			)
			this.renamedTables = preMigrationData.tablesForRenaming ?? {}
			this.renamedColumns = preMigrationData.columnsForRenaming ?? {}
			this.migrationTableOrder = preMigrationData.migrationTableOrder ?? []
			
			//Recreate tables that have been renamed:
			console.log(`Dropping renamed tables...`)
			for (const newTableName in this.renamedTables) {
				const structure = this.sqlGenerator.tables[newTableName]
				this.recreateTable(structure)
			}
			
			//Find changed foreign keys:
			if(databaseExists)
				this.migrateForeignKeys(this.sqlGenerator)
			
			//(re)create tables if needed:
			this.createTables()
			
			//Run Table alterations:
			if(databaseExists) {
				const additionalQuery = this.migrateColumns(this.sqlGenerator)
				if(additionalQuery) {
					console.log(`Table alterations:\n${additionalQuery}`)
					db.exec(additionalQuery)
				}
			}
			
			//Recreate data:
			this.moveDataFromBackup(backupDb)
			
			//Run post migrations:
			this.dbInstructions.postMigration(db, fromVersion, this.dbInstructions.version, preMigrationData.dataForPostMigration ?? {})
			
			//Update database version:
			db.pragma(`user_version = ${this.dbInstructions.version}`)
		})
		
		transaction()
	}
	
	private getBackupTableName(tableName: string): string {
		return this.renamedTables[tableName] ?? tableName;
	}
	
	/**
	 * Drops a table and adds all columns that exist in the backup to {@link columnsToTransfer} to be refilled from the backup.
	 * This method is used mostly to update the structure of a table when its changes can not be migrated through {@link migrateColumns()}
	 * making use of the fact that the table is automatically recreated when DataMigrationManager starts.
	 * @param structure the table data that is dropped
	 */
	private recreateTable(structure: TableStructure<any>) {
		const tableName = BasePublicTable.getName(structure.table)
		const backupTableName = this.getBackupTableName(tableName);
		
		if(this.tableExists(backupTableName)) { // at this point all tables still have their old name
			//find all columns that exist in old and new table:
			const renamedColumns = this.renamedColumns[tableName] ?? {};
			const oldColumnList = this.db.pragma(`table_info(${backupTableName})`) as ColumnInfo[]
			const columnsForMoving = structure.columns
				.filter(newColumn => oldColumnList
					.find(oldColumn => oldColumn.name == (renamedColumns[newColumn.name] ?? newColumn.name)) != null
				)
				.map(column => column.name)
			
			const query = SqlQueryGenerator.getDropTableSql(tableName)
			const statement = this.db.prepare(query)
			statement.run()
			
			console.log(`Dropped table ${tableName}`)
			
			this.droppedTables[tableName] = true
			this.columnsToTransfer.push({
				backupTable: backupTableName,
				newTable: tableName,
				backupIdColumn: this.getPrimaryKeyColumn(oldColumnList),
				backupColumns: columnsForMoving.map(columnName => renamedColumns[columnName] ?? columnName),
				newColumns: columnsForMoving
			})
		}
		else
			console.log(`Not recreating ${tableName} because it does not exist`)
	}
	
	private tableExists(tableName: string): boolean {
		const statement = this.db.prepare("SELECT name FROM sqlite_master WHERE name = ? LIMIT 1")
		const result = statement.get(tableName)
		return !!result
	}
	
	private migrateForeignKeys(tableStructure: SqlQueryGenerator) {
		console.log("Migrating foreign keys...")
		
		for(const tableName in tableStructure.tables) {
			if(this.droppedTables[tableName])
				continue
			const structure = tableStructure.tables[tableName]
			const newForeignKeys = structure.foreignKeys
			
			const oldForeignKeys = this.db.pragma(`foreign_key_list(${tableName})`) as ForeignKeyInfo<BasePublicTable>[]
			
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
					|| ((oldForeignKey.on_update ?? "NO ACTION") != (newForeignKey.on_update ?? "NO ACTION"))
					|| ((oldForeignKey.on_delete ?? "NO ACTION") != (newForeignKey.on_delete ?? "NO ACTION"))
				) {
					count = -1
					break
				}
			}
			
			if(count != oldForeignKeys.length)
				this.recreateTable(structure)
		}
	}
	
	/**
	 * Checks all columns of a table, creates them if they do not exist in the database and modifies them if needed.
	 * Also adds all changed columns that exist in the backup to {@link columnsToTransfer} to be refilled from the backup.
	 * @param tableStructure The table whose columns should be migrated.
	 */
	private migrateColumns(tableStructure: SqlQueryGenerator): string {
		let additionalQuery = ""
		for(const tableName in tableStructure.tables) {
			if(this.droppedTables[tableName])
				continue
			
			const oldTableName = this.getBackupTableName(tableName);
			
			const newTableDefinition = tableStructure.tables[tableName]
			
			const oldColumnList = this.db.pragma(`table_info(${oldTableName})`) as ColumnInfo[]
			const oldPrimaryKey = this.getPrimaryKeyColumn(oldColumnList)
			
			const newColumnList = newTableDefinition.columns
			const newPrimaryKey = newTableDefinition.primaryKey
			
			const renamedColumns = this.renamedColumns[tableName] ?? {};
			const backupColumnsToTransfer: string[] = [];
			const newColumnsToTransfer: string[] = [];
			
			for(const newColumn of newColumnList) {
				const oldColumnName = renamedColumns[newColumn.name] ?? newColumn.name;
				const oldColumn = oldColumnList.find(entry => entry.name == oldColumnName)
				
				if(oldColumn == undefined || oldColumnName != newColumn.name) {
					additionalQuery += SqlQueryGenerator.createNewColumnSql(tableName, newColumn)
					if(oldColumn) {
						backupColumnsToTransfer.push(oldColumnName)
						newColumnsToTransfer.push(newColumn.name)
					}
				}
				else if(newColumn.type != oldColumn.type || newColumn.dflt_value != oldColumn.dflt_value) {
					additionalQuery += SqlQueryGenerator.modifyColumnSql(tableName, newColumn)
					backupColumnsToTransfer.push(oldColumnName)
					newColumnsToTransfer.push(newColumn.name)
				}
			}
			
			if(backupColumnsToTransfer.length) {
				this.columnsToTransfer.push({
					backupTable: oldTableName,
					newTable: tableName,
					backupIdColumn: oldPrimaryKey,
					newIdColumn: newPrimaryKey.toString(),
					backupColumns: backupColumnsToTransfer,
					newColumns: newColumnsToTransfer,
				})
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
	
	
	private moveDataFromBackup(backupDb: BetterSqlite3.Database ) {
		this.columnsToTransfer.sort((a,b) => {
			const posA = this.migrationTableOrder.indexOf(a.newTable)
			const posB = this.migrationTableOrder.indexOf(b.newTable)
			return (posA == -1 ? Number.MAX_VALUE : posA) - (posB == -1 ? Number.MAX_VALUE : posB)
		});
		
		for(const entry of this.columnsToTransfer) {
			console.log(`***** Recreating column data from ${entry.newTable}: ${entry.newColumns.join(", ")}`)
			
			const selectSql = SqlQueryGenerator.createSelectSql(
				entry.backupTable,
				[entry.backupIdColumn, ...entry.backupColumns]
			)
			const statement = backupDb.prepare(selectSql)
			const oldData = statement.all() as any[]
			
			for(const data of oldData) {
				const values: Record<string, unknown> = {}
				for(let i = 0; i < entry.newColumns.length; ++i) {
					const newKey = entry.newColumns[i]
					const oldKey = entry.backupColumns[i]
					values[newKey] = data[oldKey]
				}
				const sqlValues = Object.values(values).map(value => SqlQueryGenerator.toSqlValue(value))
				let query: string
				let queryValues: unknown[] = []
				if(entry.newIdColumn) {
					query = SqlQueryGenerator.createUpdateSql(entry.newTable, { "=": values }, `${entry.newIdColumn} = ?`)
					queryValues = [...Object.values(sqlValues), data[entry.backupIdColumn]]
				}
				else {
					query = SqlQueryGenerator.createInsertSql(entry.newTable, values)
					queryValues = Object.values(sqlValues)
				}
				console.log(query, queryValues)
				const statement = this.db.prepare(query)
				statement.run(queryValues)
			}
		}
		this.columnsToTransfer = []
	}
}
