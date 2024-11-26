import {ConfirmMessage} from "./ConfirmMessage";
import {PubPossibleSpendingEntry} from "../public/PubPossibleSpendingEntry";

export class AddToWaitingMessage extends ConfirmMessage {
	public readonly spendingEntryId: number | bigint
	constructor(
		entry: PubPossibleSpendingEntry
	) {
		super()
		this.spendingEntryId = entry.possibleSpendingEntryId
	}
}
