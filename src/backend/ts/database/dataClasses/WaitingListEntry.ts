import {TableDefinition} from "../TableDefinition";
import {DonationEntry} from "./DonationEntry";
import {User} from "./User";
import {TableSettings} from "../TableSettings";

export class WaitingListEntry implements TableDefinition {
	getPrimaryKey(): keyof this {
		return "waitingListEntryId"
	}
	getSettings(): TableSettings<this> {
		const settings = new TableSettings<this>()
		
		settings.setForeignKey("donationEntryId", {
			table: DonationEntry,
			to: "donationEntryId"
		})
		
		settings.setForeignKey("userId", {
			table: User,
			to: "userId"
		})
		
		return settings
	}
	
	public waitingListEntryId: number | bigint = 0
	public userId: number | bigint = 0
	public donationEntryId: number | bigint = 0
	public addedAt: number = 0
}
