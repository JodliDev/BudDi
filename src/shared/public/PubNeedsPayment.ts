import {BasePublicTable} from "../BasePublicTable";

export class PubNeedsPayment extends BasePublicTable {
	public needsPaymentId: number | bigint = 0
	public addedAt: number = 0
	public amount: number = 0
}
