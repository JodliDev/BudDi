import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {column} from "../../database/column";
import {LoggedInMessageAction} from "../LoggedInMessageAction";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {Budget} from "../../database/dataClasses/Budget";
import {NeedsPayment} from "../../database/dataClasses/NeedsPayment";
import {Waiting} from "../../database/dataClasses/Waiting";
import {AddToWaitingMessageAction} from "./AddToWaitingMessageAction";
import {History} from "../../database/dataClasses/History";
import {ChooseForSpendingMessage} from "../../../../shared/messages/ChooseForSpendingMessage";

// noinspection JSUnusedGlobalSymbols
export class ChooseForSpendingMessageAction extends LoggedInMessageAction<ChooseForSpendingMessage> {
	
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const success = ChooseForSpendingMessageAction.addNewChoice(db, session.userId!, this.data.spendingAmount)
		session.send(new ConfirmResponseMessage(this.data, success))
	}
	
	public static addNewChoice(db: DatabaseManager, userId: number | bigint, amount: number): boolean {
		const [data] = db.selectJoinedTable(
			Waiting,
			["budgetId", "waitingId"],
			[
				{
					joinedTable: Budget,
					select: ["spendingName"],
					on: `${column(Waiting, "budgetId")} = ${column(Budget, "budgetId")}`,
				}
			],
			`${column(Waiting, "userId")} = ${userId}`,
			1,
			undefined,
			"RANDOM()"
		)
		const waitingEntry = data.item
		const possibleSpendingEntry = data.joined["Budget"] as Budget
		
		if(!waitingEntry)
			return false
		
		const [needsSpendingEntry] = db.selectTable(
			NeedsPayment,
			`${column(NeedsPayment, "budgetId")} = ${waitingEntry.budgetId}`,
			1
		)
		
		if(needsSpendingEntry) {
			db.update(
				NeedsPayment, 
				{"+=": {amount: amount}}, 
				`${column(NeedsPayment, "budgetId")} = ${waitingEntry.budgetId}`
			)
		}
		else {
			db.insert(NeedsPayment, {
				budgetId: waitingEntry.budgetId,
				userId: userId,
				addedAt: Date.now(),
				amount: amount
			})
		}
		db.delete(Waiting, `${column(Waiting, "waitingId")} = ${waitingEntry.waitingId}`)
		
		History.addHistory(db, userId, "historyChooseForSpending", [possibleSpendingEntry.spendingName])
		
		this.refillWaitingEntriesIfNeeded(db, userId)
		
		return true
	}
	
	public static refillWaitingEntriesIfNeeded(db: DatabaseManager, userId: number | bigint) {
		const entriesLeft = db.getCount(Waiting, `${column(Waiting, "userId")} = ${userId}`)
		if(entriesLeft != 0)
			return
		
		const possibleSpendingEntries = db.selectTable(
			Budget,
			`${column(Budget, "userId")} = ${userId} AND ${column(Budget, "enabled")} = 1`
		)
		for(const possibleSpendingEntry of possibleSpendingEntries) {
			AddToWaitingMessageAction.createEntry(db, userId, possibleSpendingEntry)
		}
		
		History.addHistory(db, userId, "historyRefillList", [])
	}
}
