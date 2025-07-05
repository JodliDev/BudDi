import {BinaryUploadMessage} from "./BinaryUploadMessage";
import {PubBudget} from "../public/PubBudget";

export class AddPaymentMessage extends BinaryUploadMessage {
	public readonly budgetId: number | bigint
	
	constructor(
		public readonly amount: number,
		sendFile: Blob | undefined,
		public readonly receiptFileType: string | undefined,
		public readonly receiptFileName: string | undefined,
		public readonly addToDownPayments: number,
		budget: PubBudget
	) {
		super(sendFile)
		this.budgetId = budget.budgetId
	}
}
