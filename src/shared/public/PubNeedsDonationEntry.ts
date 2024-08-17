import {BasePublicTable} from "../BasePublicTable";

export class PubNeedsDonationEntry extends BasePublicTable {
	getPrimaryKey(): keyof this {
		return "needsDonationEntryId"
	}
	
	public needsDonationEntryId: number | bigint = 0
	public addedAt: number = 0
	public amount: number = 0
}
