import {LoginMessage} from "../../../../shared/messages/LoginMessage";
import {BaseBackendMessageAction} from "../BaseBackendMessageAction";
import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {ConfirmMessage} from "../../../../shared/messages/ConfirmMessage";
import {User} from "../../database/dataClasses/User";
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
import {SetAsPaidMessage} from "../../../../shared/messages/SetAsPaidMessage";

export class SetAsPaidMessageAction extends AuthorisedMessageAction<SetAsPaidMessage> {
	
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const [needsDonationEntry] = db.tableSelect(
			NeedsDonationEntry, 
			`${column(NeedsDonationEntry, "userId")} = ${session.userId} AND ${column(NeedsDonationEntry, "needsDonationEntryId")} = ${this.data.needsDonationEntry}`,
			1
		)
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
