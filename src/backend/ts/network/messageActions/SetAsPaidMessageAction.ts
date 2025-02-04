import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {column} from "../../database/column";
import {LoggedInMessageAction} from "../LoggedInMessageAction";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {PossibleSpendingEntry} from "../../database/dataClasses/PossibleSpendingEntry";
import {NeedsSpendingEntry} from "../../database/dataClasses/NeedsSpendingEntry";
import {SetAsPaidMessage} from "../../../../shared/messages/SetAsPaidMessage";
import {BudgetHistory} from "../../database/dataClasses/BudgetHistory";

// noinspection JSUnusedGlobalSymbols
export class SetAsPaidMessageAction extends LoggedInMessageAction<SetAsPaidMessage> {
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const [data] = db.selectJoinedTable(
			NeedsSpendingEntry,
			["possibleSpendingEntryId", "needsSpendingEntryId", "amount"],
			[
				{
					joinedTable: PossibleSpendingEntry,
					select: ["spendingName"],
					on: `${column(NeedsSpendingEntry, "possibleSpendingEntryId")} = ${column(PossibleSpendingEntry, "possibleSpendingEntryId")}`,
				}
			],
			`${column(NeedsSpendingEntry, "userId")} = ${session.userId} AND ${column(NeedsSpendingEntry, "needsSpendingEntryId")} = ${this.data.needsSpendingEntry}`,
			1,
		)
		const needsSpendingEntry = data.item
		const spendingEntry = data.joined["PossibleSpendingEntry"] as PossibleSpendingEntry
		
		if(!needsSpendingEntry) {
			session.send(new ConfirmResponseMessage(this.data, false))
			return
		}
		
		db.delete(NeedsSpendingEntry, `${column(NeedsSpendingEntry, "needsSpendingEntryId")} = ${needsSpendingEntry.needsSpendingEntryId}`)
		db.update(
			PossibleSpendingEntry, 
			{
				"+=": {
					lastSpending: Date.now(),
					spendingSum: needsSpendingEntry.amount,
					spendingTimes: 1
				}
			},
			`${column(PossibleSpendingEntry, "possibleSpendingEntryId")} = ${needsSpendingEntry.possibleSpendingEntryId}`
		)
		BudgetHistory.addHistory(db, session.userId!, "historySetAsPaid", [spendingEntry.spendingName])
		session.send(new ConfirmResponseMessage(this.data, true))
	}
}
