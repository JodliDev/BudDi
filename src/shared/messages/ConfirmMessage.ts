import {BaseMessage} from "../BaseMessage";

export class ConfirmMessage extends BaseMessage {
	private static idCounter = 1
	constructor(
		public readonly confirmId: number = 0,
	) {
		super()
		if(!this.confirmId)
			this.confirmId = ++ConfirmMessage.idCounter
	}
}
