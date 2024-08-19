import {LoginMessage} from "../../../../shared/messages/LoginMessage";
import {BaseBackendMessageAction} from "../BaseBackendMessageAction";
import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {ConfirmMessage} from "../../../../shared/messages/ConfirmMessage";
import {DonationAmountType, User} from "../../database/dataClasses/User";
import {column} from "../../database/column";
import bcrypt from "bcrypt";
import {LoginSession} from "../../database/dataClasses/LoginSession";
import {LoginResponseMessage} from "../../../../shared/messages/LoginResponseMessage";
import {NoPermissionException} from "../../exceptions/NoPermissionException";
import {AuthorisedMessageAction} from "../AuthorisedMessageAction";
import {AddToDonationMessage} from "../../../../shared/messages/AddToDonationMessage";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {DonationEntry} from "../../database/dataClasses/DonationEntry";
import {NeedsDonationEntry} from "../../database/dataClasses/NeedsDonationEntry";
import {WaitingEntry} from "../../database/dataClasses/WaitingEntry";
import {AddToDonationMessageAction} from "./AddToDonationMessageAction";

export class ChooseDonationMessageAction extends AuthorisedMessageAction<AddToDonationMessage> {
	
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const success = ChooseDonationMessageAction.saveChoice(db, session.userId!)
		session.send(new ConfirmResponseMessage(this.data, success))
	}
	
	public static saveChoice(db: DatabaseManager, userId: number | bigint): boolean {
		const [waitingEntry] = db.tableSelect(
			WaitingEntry,
			`${column(WaitingEntry, "userId")} = ${userId}`,
			1,
			undefined,
			"RANDOM()"
		)
		if(!waitingEntry)
			return false
		
		const amount = this.getDonationAmount(db, userId)
		
		db.insert(NeedsDonationEntry, {
			donationEntryId: waitingEntry.donationEntryId,
			userId: userId,
			addedAt: Date.now(),
			amount: amount
		})
		db.delete(WaitingEntry, `${column(WaitingEntry, "waitingEntryId")} = ${waitingEntry.waitingEntryId}`)
		const entriesLeft = db.getCount(WaitingEntry, `${column(WaitingEntry, "userId")} = ${userId}`)
		
		if(entriesLeft == 0)
			this.refillWaitingEntries(db, userId!)
		
		return true
	}
	
	private static getDonationAmount(db: DatabaseManager, userId: number | bigint) {
		const [user] = db.tableSelect(User, `${column(User, "userId")} = ${userId}`, 1)
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
		const donationEntries = db.tableSelect(
			DonationEntry,
			`${column(DonationEntry, "userId")} = ${userId} AND ${column(DonationEntry, "enabled")} = 1`
		)
		for(const donationEntry of donationEntries) {
			AddToDonationMessageAction.createEntry(db, userId, donationEntry)
		}
	}
}
