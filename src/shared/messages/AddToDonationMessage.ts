import {ConfirmMessage} from "./ConfirmMessage";
import {PubDonationEntry} from "../public/PubDonationEntry";

export class AddToDonationMessage extends ConfirmMessage {
	public readonly donationEntryId: number | bigint
	constructor(
		entry: PubDonationEntry
	) {
		super()
		this.donationEntryId = entry.donationEntryId
	}
}
