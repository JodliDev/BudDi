import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {column} from "../../database/column";
import {LoggedInMessageAction} from "../LoggedInMessageAction";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {DonationEntry} from "../../database/dataClasses/DonationEntry";
import {NeedsDonationEntry} from "../../database/dataClasses/NeedsDonationEntry";
import {SetAsPaidMessage} from "../../../../shared/messages/SetAsPaidMessage";
import {DonationHistory} from "../../database/dataClasses/DonationHistory";

export class SetAsPaidMessageAction extends LoggedInMessageAction<SetAsPaidMessage> {
	
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const [data] = db.selectJoinedTable(
			NeedsDonationEntry,
			["donationEntryId"],
			[
				{
					joinedTable: DonationEntry,
					select: ["donationName"],
					on: `${column(NeedsDonationEntry, "donationEntryId")} = ${column(DonationEntry, "donationEntryId")}`,
				}
			],
			`${column(NeedsDonationEntry, "userId")} = ${session.userId} AND ${column(NeedsDonationEntry, "needsDonationEntryId")} = ${this.data.needsDonationEntry}`,
			1,
		)
		const needsDonationEntry = data.item
		const donationEntry = data.joined["DonationEntry"] as DonationEntry
		
		if(!needsDonationEntry) {
			session.send(new ConfirmResponseMessage(this.data, false))
			return
		}
		
		db.delete(NeedsDonationEntry, `${column(NeedsDonationEntry, "needsDonationEntryId")} = ${needsDonationEntry.needsDonationEntryId}`)
		db.update(
			DonationEntry, 
			{
				"+=": {
					lastDonation: Date.now(),
					donationsSum: needsDonationEntry.amount,
					donationTimes: 1
				}
			},
			`${column(DonationEntry, "donationEntryId")} = ${needsDonationEntry.donationEntryId}`
		)
		DonationHistory.addHistory(db, session.userId!, "historySetAsPaid", [donationEntry.donationName])
		session.send(new ConfirmResponseMessage(this.data, true))
	}
}
