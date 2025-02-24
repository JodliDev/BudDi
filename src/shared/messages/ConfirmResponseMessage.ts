import {BaseMessage} from "../BaseMessage";
import {ConfirmMessage} from "./ConfirmMessage";

export class ConfirmResponseMessage extends BaseMessage {
	public readonly confirmId: number
	
	constructor(
		confirmMessage: ConfirmMessage,
		public readonly success: boolean,
		public readonly reason?: string,
	) {
		super()
		this.confirmId = confirmMessage.confirmId
	}
}
