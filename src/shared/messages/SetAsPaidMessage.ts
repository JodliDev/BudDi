import {ConfirmMessage} from "./ConfirmMessage";
import {PubNeedsPayment} from "../public/PubNeedsPayment";

export class SetAsPaidMessage extends ConfirmMessage {
	public readonly needsPaymentId: number | bigint
	constructor(
		entry: PubNeedsPayment
	) {
		super()
		this.needsPaymentId = entry.needsPaymentId
	}
}
