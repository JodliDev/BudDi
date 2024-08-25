import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {column} from "../../database/column";
import {LoggedInMessageAction} from "../LoggedInMessageAction";
import {AddToDonationMessage} from "../../../../shared/messages/AddToDonationMessage";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {DonationEntry} from "../../database/dataClasses/DonationEntry";
import {WaitingEntry} from "../../database/dataClasses/WaitingEntry";

export class AddToDonationMessageAction extends LoggedInMessageAction<AddToDonationMessage> {
	
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const [donationEntry] = db.selectTable(
			DonationEntry, 
			`${column(DonationEntry, "userId")} = ${session.userId} AND ${column(DonationEntry, "donationEntryId")} = ${this.data.donationEntryId}`,
			1
		)
		if(!donationEntry) {
			session.send(new ConfirmResponseMessage(this.data, false))
			return
		}
		
		AddToDonationMessageAction.createEntry(db, session.userId!, donationEntry)
		session.send(new ConfirmResponseMessage(this.data, true))
	}
	
	public static createEntry(db: DatabaseManager, userId: number | bigint, donationEntry: DonationEntry) {
		db.insert(WaitingEntry, {
			userId: userId,
			addedAt: Date.now(),
			donationEntryId: donationEntry.donationEntryId,
		})
		
	}
}
