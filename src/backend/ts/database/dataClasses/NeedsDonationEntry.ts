import {DonationEntry} from "./DonationEntry";
import {User} from "./User";
import {TableSettings} from "../TableSettings";
import {PubNeedsDonationEntry} from "../../../../shared/public/PubNeedsDonationEntry";
import {column} from "../column";

export class NeedsDonationEntry extends PubNeedsDonationEntry {
	getSettings(): TableSettings<this> {
		const settings = new TableSettings<this>()
		
		settings.setForeignKey("donationEntryId", {
			table: DonationEntry,
			to: "donationEntryId",
			on_delete: "CASCADE",
			isPublic: true
		})
		
		settings.setForeignKey("userId", {
			table: User,
			to: "userId",
			on_delete: "CASCADE"
		})
		
		settings.setListFilter(userId => `${column(NeedsDonationEntry, "userId")} = ${userId}`)
		settings.setFloatValues("amount")
		
		settings.setOnBeforeAdd((data, db, userId) => {
			data.userId = userId
		})
		
		return settings
	}
	
	public userId: number | bigint = 0
	public donationEntryId: number | bigint = 0
}
