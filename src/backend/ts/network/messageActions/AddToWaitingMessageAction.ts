import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {column} from "../../database/column";
import {LoggedInMessageAction} from "../LoggedInMessageAction";
import {AddToWaitingMessage} from "../../../../shared/messages/AddToWaitingMessage";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {PossibleSpendingEntry} from "../../database/dataClasses/PossibleSpendingEntry";
import {WaitingEntry} from "../../database/dataClasses/WaitingEntry";

// noinspection JSUnusedGlobalSymbols
export class AddToWaitingMessageAction extends LoggedInMessageAction<AddToWaitingMessage> {
	
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const [spendingEntry] = db.selectTable(
			PossibleSpendingEntry, 
			`${column(PossibleSpendingEntry, "userId")} = ${session.userId} AND ${column(PossibleSpendingEntry, "possibleSpendingEntryId")} = ${this.data.spendingEntryId}`,
			1
		)
		if(!spendingEntry) {
			session.send(new ConfirmResponseMessage(this.data, false))
			return
		}
		
		AddToWaitingMessageAction.createEntry(db, session.userId!, spendingEntry)
		session.send(new ConfirmResponseMessage(this.data, true))
	}
	
	public static createEntry(db: DatabaseManager, userId: number | bigint, possibleSpendingEntry: PossibleSpendingEntry) {
		db.insert(WaitingEntry, {
			userId: userId,
			addedAt: Date.now(),
			possibleSpendingEntryId: possibleSpendingEntry.possibleSpendingEntryId,
		})
		
	}
}
