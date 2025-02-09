import {BaseMessage} from "../BaseMessage";
import {LoginData} from "../LoginData";

export class IsLoggedInMessage extends BaseMessage {
	constructor(
		public readonly loggedInData: LoginData
	) {
		super();
	}
}
