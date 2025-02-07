import {ConfirmMessage} from "./ConfirmMessage";

export class ChooseForPaymentMessage extends ConfirmMessage {
	
	constructor(public readonly spendingAmount: number) {
		super();
	}
}
