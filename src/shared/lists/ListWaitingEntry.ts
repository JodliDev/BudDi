import {BaseListEntry} from "../BaseListEntry";

export class ListWaitingEntry extends BaseListEntry {
	getPrimaryKey(): keyof this {
		return "waitingListEntryId"
	}
	
	public waitingListEntryId: number | bigint = 0
	public addedAt: number = 0
}
