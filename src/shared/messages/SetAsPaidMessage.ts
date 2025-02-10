import {PubNeedsPayment} from "../public/PubNeedsPayment";
import {BinaryUploadMessage} from "./BinaryUploadMessage";
import {PubBudget} from "../public/PubBudget";

export class SetAsPaidMessage extends BinaryUploadMessage {
	public readonly budgetId: number | bigint
	public readonly needsPaymentId?: number | bigint
	
	constructor(
		sendFile: Blob | undefined,
		public readonly receiptFileType: string | undefined,
		public readonly receiptFileName: string | undefined,
		public readonly amount: number,
		budget: PubBudget,
		payment?: PubNeedsPayment
	) {
		super(sendFile)
		this.budgetId = budget.budgetId
		this.needsPaymentId = payment?.needsPaymentId
	}
}
