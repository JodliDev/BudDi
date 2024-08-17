import {User} from "./User";
import {TableSettings} from "../TableSettings";
import {PubDonationEntry} from "../../../../shared/public/PubDonationEntry";
import {column} from "../column";
import {WaitingEntry} from "./WaitingEntry";

export class DonationEntry extends PubDonationEntry {
	getSettings(): TableSettings<this> {
		const settings = new TableSettings<this>()

		settings.setForeignKey("userId", {
			table: User,
            to: "userId",
			on_delete: "CASCADE"
		})
		
		settings.setOnBeforeAdd((data, db, userId) => {
			data.userId = userId
		})
		settings.setOnAfterAdd((data, db, addedId) => {
			db.insert(WaitingEntry, { donationEntryId: addedId, userId: data.userId })
		})
		
		settings.setListFilter(userId => `${column(DonationEntry, "userId")} = ${userId}`)
		settings.setFloatValues("donationsSum")

		return settings
	}
	
	public userId: number | bigint = 0
}
