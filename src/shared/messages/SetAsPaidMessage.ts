import {ConfirmMessage} from "./ConfirmMessage";
import {PubNeedsSpendingEntry} from "../public/PubNeedsSpendingEntry";

export class SetAsPaidMessage extends ConfirmMessage {
	public readonly needsSpendingEntry: number | bigint
	constructor(
		entry: PubNeedsSpendingEntry
	) {
		super()
		this.needsSpendingEntry = entry.needsSpendingEntryId
	}
}
