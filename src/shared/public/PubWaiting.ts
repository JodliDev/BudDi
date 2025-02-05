import {BasePublicTable} from "../BasePublicTable";

export class PubWaiting extends BasePublicTable {
	getPrimaryKey(): keyof this {
		return "waitingId"
	}
	
	public waitingId: number | bigint = 0
	public addedAt: number = 0
}
