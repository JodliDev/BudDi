import {User} from "./dataClasses/User";
import {Class} from "../../../shared/Class";
import {LoginSession} from "./dataClasses/LoginSession";
import {BasePublicTable} from "../../../shared/BasePublicTable";
import BetterSqlite3 from "better-sqlite3";
import {Schedule} from "./dataClasses/Schedule";
import {History} from "./dataClasses/History";
import {PreMigrationData} from "./DatabaseMigrationManager";
import {NeedsPayment} from "./dataClasses/NeedsPayment";
import {Waiting} from "./dataClasses/Waiting";
import {Budget} from "./dataClasses/Budget";

export class DatabaseInstructions {
	public version: number = 8
	
	public tables: Class<BasePublicTable>[] = [
		Budget,
		LoginSession,
		User,
		Waiting,
		NeedsPayment,
		Schedule,
		History
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
		
		if(fromVersion <= 6) {
			const statement = db.prepare("UPDATE PossibleSpendingEntry SET spendingSum = 0 WHERE spendingSum IS NULL")
			statement.run()
		}
		
		if(fromVersion <= 7) {
			output.migrationTableOrder = ["Budget", "NeedsPayment", "Waiting"]
			output.tablesForRenaming = {
				History: "BudgetHistory",
				NeedsPayment: "NeedsSpendingEntry",
				Budget: "PossibleSpendingEntry",
				Waiting: "WaitingEntry",
			}

			output.columnsForRenaming = {
				NeedsPayment: {
					"budgetId": "possibleSpendingEntryId",
					"needsSpendingId": "needsSpendingEntryId",
				},
				Budget: {
					"budgetId": "possibleSpendingEntryId",
					"needsSpendingId": "needsSpendingEntryId",
				},
				Waiting: {
					"waitingId": "waitingEntryId",
					"budgetId": "possibleSpendingEntryId",
				}
			}
		}
		
		return output
	}
	public postMigration(db: BetterSqlite3.Database, fromVersion: number, toVersion: number, preData: Record<number, unknown>): void {
	
	}
	
	
}
