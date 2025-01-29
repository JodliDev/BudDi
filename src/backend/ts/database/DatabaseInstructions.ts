import {PossibleSpendingEntry} from "./dataClasses/PossibleSpendingEntry";
import {WaitingEntry} from "./dataClasses/WaitingEntry";
import {User} from "./dataClasses/User";
import {Class} from "../../../shared/Class";
import {LoginSession} from "./dataClasses/LoginSession";
import {BasePublicTable} from "../../../shared/BasePublicTable";
import BetterSqlite3 from "better-sqlite3";
import {NeedsSpendingEntry} from "./dataClasses/NeedsSpendingEntry";
import {Schedule} from "./dataClasses/Schedule";
import {BudgetHistory} from "./dataClasses/BudgetHistory";
import {PreMigrationData} from "./DatabaseMigrationManager";

export class DatabaseInstructions {
	public version: number = 6
	
	public tables: Class<BasePublicTable>[] = [
		PossibleSpendingEntry,
		LoginSession,
		User,
		WaitingEntry,
		NeedsSpendingEntry,
		Schedule,
		BudgetHistory
	]
	
	/**
	 * Custom migrations that will run before the MigrationManager does its thing
	 * @param db link to current database for database operations
	 * @param fromVersion Version of current database
	 * @param toVersion Version of database after update
	 * @return See {@link PreMigrationData}
	 */
	public preMigration(
		db: BetterSqlite3.Database,
		fromVersion: number,
		toVersion: number
	): PreMigrationData {
		const output: PreMigrationData = {}
		
		if(fromVersion == 2) {
			output.migrationTableOrder = ["PossibleSpendingEntry", "NeedsSpendingEntry"]
			
			output.tablesForRenaming = {
				BudgetHistory: "DonationHistory",
				NeedsSpendingEntry: "NeedsDonationEntry",
				PossibleSpendingEntry: "DonationEntry"
			}
			
			output.columnsForRenaming = {
				NeedsSpendingEntry: {
					"possibleSpendingEntryId": "donationEntryId",
					"needsSpendingEntryId": "needsDonationEntryId"
				},
				PossibleSpendingEntry: {
					"needsSpendingEntryId": "needsDonationEntryId",
					"possibleSpendingEntryId": "donationEntryId",
					"spendingName": "donationName",
					"spendingUrl": "donationUrl",
					"spendingSum": "donationsSum",
					"spendingTimes": "donationTimes",
					"lastSpending": "lastDonation"
				},
				User: {
					"spendingAmountType": "donationAmountType",
					"spendingAmount": "donationAmount"
				},
				WaitingEntry: {
					"possibleSpendingEntryId": "donationEntryId"
				}
			}
		}
		
		return output
	}
	public postMigration(db: BetterSqlite3.Database, fromVersion: number, toVersion: number, preData: Record<number, unknown>): void {
	
	}
	
	
}
