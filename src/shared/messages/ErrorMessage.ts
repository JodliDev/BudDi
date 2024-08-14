import {BaseMessage} from "../BaseMessage";

export class ErrorMessage extends BaseMessage {
	constructor(
		public readonly error: string,
	) {
		super()
	}
}
