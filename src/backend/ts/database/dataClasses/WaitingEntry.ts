import {TableDefinition} from "../TableDefinition";
import {DonationEntry} from "./DonationEntry";
import {User} from "./User";
import {TableSettings} from "../TableSettings";
import {ListWaitingEntry} from "../../../../shared/lists/ListWaitingEntry";

export class WaitingEntry extends ListWaitingEntry implements TableDefinition {
	getSettings(): TableSettings<this> {
		const settings = new TableSettings<this>()
		
		settings.setForeignKey("donationEntryId", {
			table: DonationEntry,
			to: "donationEntryId",
			isPublic: true
		})
		
		settings.setForeignKey("userId", {
			table: User,
			to: "userId"
		})
		
		return settings
	}
	
	public userId: number | bigint = 0
	public donationEntryId: number | bigint = 0
}
