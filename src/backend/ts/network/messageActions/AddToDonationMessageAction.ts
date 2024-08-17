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

export class AddToDonationMessageAction extends AuthorisedMessageAction<AddToDonationMessage> {
	
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const [donationEntry] = db.tableSelect(
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
