import {BasePublicTable} from "../BasePublicTable";

export class PubNeedsPayment extends BasePublicTable {
	getPrimaryKey(): keyof this {
		return "needsPaymentId"
	}
	
	public needsPaymentId: number | bigint = 0
	public addedAt: number = 0
	public amount: number = 0
}
