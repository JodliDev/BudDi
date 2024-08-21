import {ConfirmMessage} from "./ConfirmMessage";

export class ChangePasswordMessage extends ConfirmMessage {
	constructor(
		public readonly password: string
	) {
		super();
	}
}
