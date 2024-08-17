import {BasePublicTable} from "../BasePublicTable";

export class PubWaitingEntry extends BasePublicTable {
	getPrimaryKey(): keyof this {
		return "waitingEntryId"
	}
	
	public waitingEntryId: number | bigint = 0
	public addedAt: number = 0
}
