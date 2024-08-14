import {User} from "./User";
import {TableSettings} from "../TableSettings";
import {PubDonationEntry} from "../../../../shared/public/PubDonationEntry";
import {column} from "../column";

export class DonationEntry extends PubDonationEntry {
	getSettings(): TableSettings<this> {
		const settings = new TableSettings<this>()

		settings.setForeignKey("userId", {
			table: User,
            to: "userId",
		})
		
		settings.setOnAdd((data, db, userId) => {
			data.userId = userId
		})
		
		settings.setListFilter(userId => `${column(DonationEntry, "userId")} = ${userId}`)

		return settings
	}
	
	public userId: number | bigint = 0
}
