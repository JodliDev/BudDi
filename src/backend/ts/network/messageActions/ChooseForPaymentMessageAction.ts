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
import {ChooseForPaymentMessage} from "../../../../shared/messages/ChooseForPaymentMessage";
import {SqlWhere} from "../../database/SqlWhere";

// noinspection JSUnusedGlobalSymbols
export class ChooseForPaymentMessageAction extends LoggedInMessageAction<ChooseForPaymentMessage> {
	
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const success = ChooseForPaymentMessageAction.addNewChoice(db, session.userId!, this.data.amount)
		session.send(new ConfirmResponseMessage(this.data, success))
	}
	
	public static addNewChoice(db: DatabaseManager, userId: number | bigint, amount: number): boolean {
		const [data] = db.selectJoinedTable(
			Waiting,
			["budgetId", "waitingId"],
			[
				{
					joinedTable: Budget,
					select: ["budgetName"],
					on: `${column(Waiting, "budgetId")} = ${column(Budget, "budgetId")}`,
				}
			],
			SqlWhere(Waiting).is("userId", userId),
			1,
			undefined,
			"RANDOM()"
		)
		const waitingEntry = data.item
		const budget = data.joined["Budget"] as Budget
		
		if(!waitingEntry)
			return false
		
		const [needsSpendingEntry] = db.selectTable(
			NeedsPayment,
			SqlWhere(NeedsPayment).is("budgetId", waitingEntry.budgetId),
			1
		)
		
		if(needsSpendingEntry) {
			db.update(
				NeedsPayment, 
				{"+=": {amount: amount}}, 
				SqlWhere(NeedsPayment).is("budgetId", waitingEntry.budgetId)
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
		db.delete(Waiting, SqlWhere(Waiting).is("waitingId", waitingEntry.waitingId))
		
		History.addHistory(db, userId, "historyChooseForPayment", [budget.budgetName], waitingEntry.budgetId)
		
		this.refillWaitingEntriesIfNeeded(db, userId)
		
		return true
	}
	
	public static refillWaitingEntriesIfNeeded(db: DatabaseManager, userId: number | bigint) {
		const entriesLeft = db.getCount(Waiting, SqlWhere(Waiting).is("userId", userId))
		if(entriesLeft != 0)
			return
		
		const budgets = db.selectTable(
			Budget,
			SqlWhere(Budget).is("userId", userId).and().is("enabledForWaitingList", "1")
		)
		for(const budget of budgets) {
			AddToWaitingMessageAction.createEntry(db, userId, budget)
		}
		
		History.addHistory(db, userId, "historyRefillList", [])
	}
}
