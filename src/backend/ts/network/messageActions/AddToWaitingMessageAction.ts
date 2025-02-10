import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {column} from "../../database/column";
import {LoggedInMessageAction} from "../LoggedInMessageAction";
import {AddToWaitingMessage} from "../../../../shared/messages/AddToWaitingMessage";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {Budget} from "../../database/dataClasses/Budget";
import {Waiting} from "../../database/dataClasses/Waiting";
import {History} from "../../database/dataClasses/History";
import {SqlWhere} from "../../database/SqlWhere";

// noinspection JSUnusedGlobalSymbols
export class AddToWaitingMessageAction extends LoggedInMessageAction<AddToWaitingMessage> {
	
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const [budget] = db.selectTable(
			Budget,
			SqlWhere(Budget).is("userId", session.userId).and().is("budgetId", this.data.spendingEntryId),
			1
		)
		if(!budget) {
			session.send(new ConfirmResponseMessage(this.data, false))
			return
		}
		
		AddToWaitingMessageAction.createEntry(db, session.userId!, budget)
		
		History.addHistory(db, session.userId!, "historyAddToWaiting", [budget.budgetName], budget.budgetId)
		
		session.send(new ConfirmResponseMessage(this.data, true))
	}
	
	public static createEntry(db: DatabaseManager, userId: number | bigint, budget: Budget) {
		db.insert(Waiting, {
			userId: userId,
			addedAt: Date.now(),
			budgetId: budget.budgetId,
		})
		
	}
}
