import {BasePublicTable} from "../BasePublicTable";


export class PubPayment extends BasePublicTable {
	public static readonly RECEIPT_MAX_SIZE = 1e+8 //100 MB
	
	public paymentId: number | bigint = 0
	public budgetId: number | bigint = 0
	public amount: number = 0
	public paymentTime: number = 0
	public receiptFileType: string = ""
	public receiptFileName: string = ""
}
