import {DonationEntry} from "./dataClasses/DonationEntry";
import {TableDefinition} from "./TableDefinition";
import {WaitingEntry} from "./dataClasses/WaitingEntry";
import {User} from "./dataClasses/User";
import {Class} from "../../../shared/Class";
import {LoginSession} from "./dataClasses/LoginSession";

export class DatabaseInstructions {
	public version: number = 4
	
	public tables: Class<TableDefinition>[] = [
		DonationEntry,
		LoginSession,
		User,
		WaitingEntry
	]
	
	public preMigration(fromVersion: number, toVersion: number): Record<number, unknown> {
		const output: Record<number, unknown> = {}
		
		//do something
		
		return output
	}
	public postMigration(fromVersion: number, toVersion: number, preData: Record<number, unknown>): void {
	
	}
	
	
}
