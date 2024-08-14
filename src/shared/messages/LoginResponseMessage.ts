import {BaseMessage} from "../BaseMessage";
import {ConfirmMessage} from "./ConfirmMessage";
import {ConfirmResponseMessage} from "./ConfirmResponseMessage";
import {LoginMessage} from "./LoginMessage";

export class LoginResponseMessage extends ConfirmResponseMessage {
	constructor(
		message: LoginMessage,
		public readonly success: boolean,
		public readonly userId?: number | bigint,
		public readonly sessionHash?: string,
	) {
		super(message, success)
	}
}
