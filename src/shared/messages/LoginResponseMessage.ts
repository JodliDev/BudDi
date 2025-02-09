import {ConfirmResponseMessage} from "./ConfirmResponseMessage";
import {LoginMessage} from "./LoginMessage";
import {LoginData} from "../LoginData";

export class LoginResponseMessage extends ConfirmResponseMessage {
	constructor(
		message: LoginMessage,
		public readonly success: boolean,
		public readonly loggedInData?: LoginData,
		public readonly sessionSecret?: string,
	) {
		super(message, success)
	}
}
