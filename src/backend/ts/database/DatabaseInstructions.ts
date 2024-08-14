import {DonationEntry} from "./dataClasses/DonationEntry";
import {TableDefinition} from "./TableDefinition";
import {WaitingListEntry} from "./dataClasses/WaitingListEntry";
import {User} from "./dataClasses/User";
import {Class} from "../../../shared/Class";
import {LoginSession} from "./dataClasses/LoginSession";

export class DatabaseInstructions {
	public version: number = 3
	
	public tables: Class<TableDefinition>[] = [
		DonationEntry,
		LoginSession,
		User,
		WaitingListEntry
	]
	
	public preMigration(fromVersion: number, toVersion: number): Record<number, unknown> {
		const output: Record<number, unknown> = {}
		
		//do something
		
		return output
	}
	public postMigration(fromVersion: number, toVersion: number, preData: Record<number, unknown>): void {
	
	}
	
	
}
