import {ConfirmMessage} from "./ConfirmMessage";
import {PubBudget} from "../public/PubBudget";

export class AddToWaitingMessage extends ConfirmMessage {
	public readonly spendingEntryId: number | bigint
	constructor(
		entry: PubBudget
	) {
		super()
		this.spendingEntryId = entry.budgetId
	}
}
