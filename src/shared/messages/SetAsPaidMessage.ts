import {ConfirmMessage} from "./ConfirmMessage";
import {PubNeedsDonationEntry} from "../public/PubNeedsDonationEntry";

export class SetAsPaidMessage extends ConfirmMessage {
	public readonly needsDonationEntry: number | bigint
	constructor(
		entry: PubNeedsDonationEntry
	) {
		super()
		this.needsDonationEntry = entry.needsDonationEntryId
	}
}
