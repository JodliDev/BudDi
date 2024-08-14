import {TableDefinition} from "../TableDefinition";
import {User} from "./User";
import {TableSettings} from "../TableSettings";
import {ListDonationEntry} from "../../../../shared/lists/ListDonationEntry";
import {column} from "../column";

export class DonationEntry extends ListDonationEntry implements TableDefinition {
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
