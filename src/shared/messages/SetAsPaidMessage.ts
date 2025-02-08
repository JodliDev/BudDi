import {ConfirmMessage} from "./ConfirmMessage";
import {PubNeedsPayment} from "../public/PubNeedsPayment";
import {BinaryUploadMessage} from "./BinaryUploadMessage";

export class SetAsPaidMessage extends BinaryUploadMessage {
	public readonly needsPaymentId: number | bigint
	constructor(
		sendFile: Blob | undefined,
		public readonly receiptFileType: string | undefined,
		public readonly receiptFileName: string | undefined,
		entry: PubNeedsPayment,
		public readonly amount: number
	) {
		super(sendFile)
		this.needsPaymentId = entry.needsPaymentId
	}
}
