import {ConfirmMessage} from "./ConfirmMessage";

export class ChooseForSpendingMessage extends ConfirmMessage {
	
	constructor(public readonly spendingAmount: number) {
		super();
	}
}
