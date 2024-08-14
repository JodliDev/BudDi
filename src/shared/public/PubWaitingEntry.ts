import {BasePublicTable} from "../BasePublicTable";

export class PubWaitingEntry extends BasePublicTable {
	getPrimaryKey(): keyof this {
		return "waitingListEntryId"
	}
	
	public waitingListEntryId: number | bigint = 0
	public addedAt: number = 0
}
