import {BaseMessage} from "../BaseMessage";

export class IsLoggedInMessage extends BaseMessage {
	constructor(public readonly sessionId: number | bigint) {
		super();
	}
}
