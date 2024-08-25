import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager, JoinedData} from "../../database/DatabaseManager";
import {User} from "../../database/dataClasses/User";
import {column} from "../../database/column";
import {LoggedInMessageAction} from "../LoggedInMessageAction";
import {AddToDonationMessage} from "../../../../shared/messages/AddToDonationMessage";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {DonationEntry} from "../../database/dataClasses/DonationEntry";
import {NeedsDonationEntry} from "../../database/dataClasses/NeedsDonationEntry";
import {WaitingEntry} from "../../database/dataClasses/WaitingEntry";
import {AddToDonationMessageAction} from "./AddToDonationMessageAction";
import {DonationAmountType} from "../../../../shared/public/PubUser";
import {DonationHistory} from "../../database/dataClasses/DonationHistory";

export class ChooseDonationMessageAction extends LoggedInMessageAction<AddToDonationMessage> {
	
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const success = ChooseDonationMessageAction.saveChoice(db, session.userId!)
		session.send(new ConfirmResponseMessage(this.data, success))
	}
	
	public static saveChoice(db: DatabaseManager, userId: number | bigint): boolean {
		const [data] = db.selectJoinedTable(
			WaitingEntry,
			["donationEntryId", "waitingEntryId"],
			[
				{
					joinedTable: DonationEntry,
					select: ["donationName"],
					on: `${column(WaitingEntry, "donationEntryId")} = ${column(DonationEntry, "donationEntryId")}`,
				}
			],
			`${column(WaitingEntry, "userId")} = ${userId}`,
			1,
			undefined,
			"RANDOM()"
		)
		const waitingEntry = data.item
		const donationEntry = data.joined["DonationEntry"] as DonationEntry
		
		if(!waitingEntry)
			return false
		
		const amount = this.getDonationAmount(db, userId)
		
		const [needsDonationEntry] = db.selectTable(
			NeedsDonationEntry,
			`${column(NeedsDonationEntry, "donationEntryId")} = ${waitingEntry.donationEntryId}`,
			1
		)
		
		if(needsDonationEntry) {
			db.update(
				NeedsDonationEntry, 
				{"+=": {amount: amount}}, 
				`${column(NeedsDonationEntry, "donationEntryId")} = ${waitingEntry.donationEntryId}`
			)
		}
		else {
			db.insert(NeedsDonationEntry, {
				donationEntryId: waitingEntry.donationEntryId,
				userId: userId,
				addedAt: Date.now(),
				amount: amount
			})
		}
		db.delete(WaitingEntry, `${column(WaitingEntry, "waitingEntryId")} = ${waitingEntry.waitingEntryId}`)
		const entriesLeft = db.getCount(WaitingEntry, `${column(WaitingEntry, "userId")} = ${userId}`)
		
		DonationHistory.addHistory(db, userId, "historyChooseDonation", [donationEntry.donationName])
		if(entriesLeft == 0) {
			this.refillWaitingEntries(db, userId!)
			DonationHistory.addHistory(db, userId, "historyRefillList", [])
		}
		
		return true
	}
	
	private static getDonationAmount(db: DatabaseManager, userId: number | bigint) {
		const [user] = db.selectTable(User, `${column(User, "userId")} = ${userId}`, 1)
		switch(user.donationAmountType) {
			case DonationAmountType.PerEntry:
				const count = db.getCount(WaitingEntry, `${column(WaitingEntry, "userId")} = ${userId}`)
				return user.donationAmount * count
			case DonationAmountType.Fixed:
			default:
				return user.donationAmount
				
		}
	}
	
	private static refillWaitingEntries(db: DatabaseManager, userId: number | bigint) {
		const donationEntries = db.selectTable(
			DonationEntry,
			`${column(DonationEntry, "userId")} = ${userId} AND ${column(DonationEntry, "enabled")} = 1`
		)
		for(const donationEntry of donationEntries) {
			AddToDonationMessageAction.createEntry(db, userId, donationEntry)
		}
	}
}
