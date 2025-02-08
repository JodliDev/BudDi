import {BinaryDownloadMessage} from "./BinaryDownloadMessage";

export class DownloadReceiptMessage extends BinaryDownloadMessage {
	constructor(
		public readonly paymentId: number | bigint
	) {
		super()
	}
}
