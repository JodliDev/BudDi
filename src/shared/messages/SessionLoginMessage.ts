import {BaseMessage} from "../BaseMessage";

export class SessionLoginMessage extends BaseMessage {
	constructor(
		public readonly userId: number | bigint,
		public readonly sessionHash: string
	) {
		super()
	}
}
