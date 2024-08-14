import {TableDefinition} from "../TableDefinition";
import {User} from "./User";
import {TableSettings} from "../TableSettings";
import {ListDonationEntry} from "../../../../shared/lists/ListDonationEntry";

export class DonationEntry extends ListDonationEntry implements TableDefinition {
	getPrimaryKey(): keyof this {
		return "donationEntryId"
	}
	
	getSettings(): TableSettings<this> {
		const settings = new TableSettings<this>()

		settings.setForeignKey("userId", {
			table: User,
            to: "userId",
		})
		
		settings.setOnAdd((data, db, userId) => {
			data.userId = userId
		})

		return settings
	}
	
	public userId: number | bigint = 0
}
