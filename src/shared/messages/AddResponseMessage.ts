import {BaseMessage} from "../BaseMessage";
import {ConfirmMessage} from "./ConfirmMessage";
import {ConfirmResponseMessage} from "./ConfirmResponseMessage";
import {LoginMessage} from "./LoginMessage";

export class AddResponseMessage<T> extends ConfirmResponseMessage {
	constructor(
		message: LoginMessage,
		public readonly success: boolean,
		public readonly item: T
	) {
		super(message, success)
	}
}
