import {BasePublicTable} from "../BasePublicTable";

export class PubNeedsSpendingEntry extends BasePublicTable {
	getPrimaryKey(): keyof this {
		return "needsSpendingEntryId"
	}
	
	public needsSpendingEntryId: number | bigint = 0
	public addedAt: number = 0
	public amount: number = 0
}
