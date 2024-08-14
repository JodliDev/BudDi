import {DonationEntry} from "./DonationEntry";
import {User} from "./User";
import {TableSettings} from "../TableSettings";
import {BasePublicTable} from "../../../../shared/BasePublicTable";

export class NeedsDonationListEntry extends BasePublicTable {
	getPrimaryKey(): keyof this {
		return "needsDonationListEntryId"
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
	
	public needsDonationListEntryId: number | bigint = 0
	public userId: number | bigint = 0
	public donationEntryId: number | bigint = 0
	public addedAt: number = 0
	public amount: number = 0
}
