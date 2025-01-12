import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {column} from "../../database/column";
import {LoggedInMessageAction} from "../LoggedInMessageAction";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {PossibleSpendingEntry} from "../../database/dataClasses/PossibleSpendingEntry";
import {NeedsSpendingEntry} from "../../database/dataClasses/NeedsSpendingEntry";
import {WaitingEntry} from "../../database/dataClasses/WaitingEntry";
import {AddToWaitingMessageAction} from "./AddToWaitingMessageAction";
import {BudgetHistory} from "../../database/dataClasses/BudgetHistory";
import {ChooseForSpendingMessage} from "../../../../shared/messages/ChooseForSpendingMessage";

export class ChooseForSpendingMessageAction extends LoggedInMessageAction<ChooseForSpendingMessage> {
	
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const success = ChooseForSpendingMessageAction.addNewChoice(db, session.userId!, this.data.spendingAmount)
		session.send(new ConfirmResponseMessage(this.data, success))
	}
	
	public static addNewChoice(db: DatabaseManager, userId: number | bigint, amount: number): boolean {
		const [data] = db.selectJoinedTable(
			WaitingEntry,
			["possibleSpendingEntryId", "waitingEntryId"],
			[
				{
					joinedTable: PossibleSpendingEntry,
					select: ["spendingName"],
					on: `${column(WaitingEntry, "possibleSpendingEntryId")} = ${column(PossibleSpendingEntry, "possibleSpendingEntryId")}`,
				}
			],
			`${column(WaitingEntry, "userId")} = ${userId}`,
			1,
			undefined,
			"RANDOM()"
		)
		const waitingEntry = data.item
		const possibleSpendingEntry = data.joined["PossibleSpendingEntry"] as PossibleSpendingEntry
		
		if(!waitingEntry)
			return false
		
		const [needsSpendingEntry] = db.selectTable(
			NeedsSpendingEntry,
			`${column(NeedsSpendingEntry, "possibleSpendingEntryId")} = ${waitingEntry.possibleSpendingEntryId}`,
			1
		)
		
		if(needsSpendingEntry) {
			db.update(
				NeedsSpendingEntry, 
				{"+=": {amount: amount}}, 
				`${column(NeedsSpendingEntry, "possibleSpendingEntryId")} = ${waitingEntry.possibleSpendingEntryId}`
			)
		}
		else {
			db.insert(NeedsSpendingEntry, {
				possibleSpendingEntryId: waitingEntry.possibleSpendingEntryId,
				userId: userId,
				addedAt: Date.now(),
				amount: amount
			})
		}
		db.delete(WaitingEntry, `${column(WaitingEntry, "waitingEntryId")} = ${waitingEntry.waitingEntryId}`)
		const entriesLeft = db.getCount(WaitingEntry, `${column(WaitingEntry, "userId")} = ${userId}`)
		
		BudgetHistory.addHistory(db, userId, "historyChooseForSpending", [possibleSpendingEntry.spendingName])
		if(entriesLeft == 0) {
			this.refillWaitingEntries(db, userId!)
			BudgetHistory.addHistory(db, userId, "historyRefillList", [])
		}
		
		return true
	}
	
	private static refillWaitingEntries(db: DatabaseManager, userId: number | bigint) {
		const possibleSpendingEntries = db.selectTable(
			PossibleSpendingEntry,
			`${column(PossibleSpendingEntry, "userId")} = ${userId} AND ${column(PossibleSpendingEntry, "enabled")} = 1`
		)
		for(const possibleSpendingEntry of possibleSpendingEntries) {
			AddToWaitingMessageAction.createEntry(db, userId, possibleSpendingEntry)
		}
	}
}
