import {ConfirmMessage} from "./ConfirmMessage";

export class LoginMessage extends ConfirmMessage {
	constructor(
		public readonly username: string,
		public readonly password: string,
	) {
		super()
	}
}
