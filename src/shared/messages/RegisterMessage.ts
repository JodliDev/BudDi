import {ConfirmMessage} from "./ConfirmMessage";

export class RegisterMessage extends ConfirmMessage {
	constructor(
		public readonly username: string,
		public readonly password: string,
	) {
		super()
	}
}
