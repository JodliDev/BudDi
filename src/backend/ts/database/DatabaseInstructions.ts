import {User} from "./dataClasses/User";
import {Class} from "../../../shared/Class";
import {LoginSession} from "./dataClasses/LoginSession";
import {BasePublicTable} from "../../../shared/BasePublicTable";
import BetterSqlite3 from "better-sqlite3";
import {Schedule} from "./dataClasses/Schedule";
import {History} from "./dataClasses/History";
import {Migrations} from "./DatabaseMigrationManager";
import {NeedsPayment} from "./dataClasses/NeedsPayment";
import {Waiting} from "./dataClasses/Waiting";
import {Budget} from "./dataClasses/Budget";
import {column} from "./column";
import {Payment} from "./dataClasses/Payment";

export class DatabaseInstructions {
	public version: number = 9
	
	/**
	 * Order needs to reflect foreign keys
	 */
	public tables: Class<BasePublicTable>[] = [
		User,
		LoginSession,
		Budget,
		History,
		Payment,
		Waiting,
		NeedsPayment,
		Schedule,
	]
	
	/**
	 * Custom migrations that will run before the MigrationManager does its thing
	 * @param db link to current database for database operations
	 * @param fromVersion Version of current database
	 * @param toVersion Version of database after update
	 */
	public preMigration(
		db: BetterSqlite3.Database,
		migrations: Migrations,
		fromVersion: number,
		toVersion: number
	): Record<number, unknown> {
		const output: Record<number, unknown> = {}
		if(fromVersion == 2) {
			migrations.renameTable("DonationHistory", History)
			migrations.renameTable("NeedsDonationEntry", NeedsPayment)
			migrations.renameTable("DonationEntry", Budget)
			
			migrations.renameColumn(NeedsPayment, "donationEntryId", "possibleSpendingEntryId")
			migrations.renameColumn(NeedsPayment, "needsDonationEntryId", "needsSpendingEntryId")
			
			migrations.renameColumn(Budget, "donationEntryId", "possibleSpendingEntryId")
			migrations.renameColumn(Budget, "donationName", "spendingName")
			migrations.renameColumn(Budget, "donationUrl", "spendingUrl")
			migrations.renameColumn(Budget, "donationsSum", "spendingSum")
			migrations.renameColumn(Budget, "donationTimes", "spendingTimes")
			migrations.renameColumn(Budget, "lastDonation", "lastSpending")
			
			// migrations.renameColumn(User, "donationAmountType", "spendingAmountType")
			// migrations.renameColumn(User, "donationAmount", "spendingAmount")
			
			migrations.renameColumn(Waiting, "donationEntryId", "possibleSpendingEntryId")
		}
		
		if(fromVersion <= 7) {
			migrations.renameTable("BudgetHistory", History)
			migrations.renameTable("NeedsSpendingEntry", NeedsPayment)
			migrations.renameTable("PossibleSpendingEntry", Budget)
			migrations.renameTable("WaitingEntry", Waiting)
			
			migrations.renameColumn(NeedsPayment, "possibleSpendingEntryId", "budgetId")
			migrations.renameColumn(NeedsPayment, "needsSpendingEntryId", "needsPaymentId")
			
			migrations.renameColumn(Budget, "possibleSpendingEntryId", "budgetId")
			
			migrations.renameColumn(Waiting, "waitingEntryId", "waitingId")
			migrations.renameColumn(Waiting, "possibleSpendingEntryId", "budgetId")
		}
		
		if(fromVersion <= 8) {
			migrations.renameColumn(Budget, "lastSpending", "lastPayment")
			migrations.renameColumn(Budget, "spendingName", "budgetName")
			migrations.renameColumn(Budget, "spendingUrl", "paymentUrl")
		}
		
		return output
	}
	public postMigration(db: BetterSqlite3.Database, fromVersion: number, toVersion: number, preData: Record<number, unknown>): void {
		if(fromVersion <= 6) {
			const statement = db.prepare(`UPDATE ${Budget.name} SET ${column(Budget, "spendingSum", true)} = 0 WHERE ${column(Budget, "spendingSum", true)} IS NULL`)
			statement.run()
		}
	}
}
