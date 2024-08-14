import {BaseMessage} from "../BaseMessage";
import {ConfirmMessage} from "./ConfirmMessage";
import {ConfirmResponseMessage} from "./ConfirmResponseMessage";

export class ReasonedConfirmResponseMessage extends ConfirmResponseMessage {
	constructor(
		message: ConfirmMessage,
		success: boolean,
		public readonly reason?: string,
	) {
		super(message, success)
	}
}
