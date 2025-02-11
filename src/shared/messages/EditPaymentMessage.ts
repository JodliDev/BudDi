import {BinaryUploadMessage} from "./BinaryUploadMessage";
import {PubPayment} from "../public/PubPayment";

export class EditPaymentMessage extends BinaryUploadMessage {
	public readonly paymentId: number | bigint
	
	constructor(
		public readonly amount: number,
		public readonly deleteExistingReceipt: boolean,
		sendFile: Blob | undefined,
		public readonly receiptFileType: string | undefined,
		public readonly receiptFileName: string | undefined,
		payment: PubPayment
	) {
		super(sendFile)
		this.paymentId = payment.paymentId
	}
}
