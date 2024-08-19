import {DonationEntry} from "./dataClasses/DonationEntry";
import {WaitingEntry} from "./dataClasses/WaitingEntry";
import {User} from "./dataClasses/User";
import {Class} from "../../../shared/Class";
import {LoginSession} from "./dataClasses/LoginSession";
import {BasePublicTable} from "../../../shared/BasePublicTable";
import BetterSqlite3 from "better-sqlite3";
import {NeedsDonationEntry} from "./dataClasses/NeedsDonationEntry";
import {Schedule} from "./dataClasses/Schedule";

export class DatabaseInstructions {
	public version: number = 1
	
	public tables: Class<BasePublicTable>[] = [
		DonationEntry,
		LoginSession,
		User,
		WaitingEntry,
		NeedsDonationEntry,
		Schedule
	]
	
	public preMigration(db: BetterSqlite3.Database, recreateTables: (tableName: string[]) => void, fromVersion: number, toVersion: number): Record<number, unknown> {
		const output: Record<number, unknown> = {}
		
		//do something
		
		return output
	}
	public postMigration(db: BetterSqlite3.Database, fromVersion: number, toVersion: number, preData: Record<number, unknown>): void {
	
	}
	
	
}
