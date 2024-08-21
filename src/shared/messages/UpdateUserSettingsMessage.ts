import {UserSettings} from "../UserSettings";
import {ConfirmMessage} from "./ConfirmMessage";

export class UpdateUserSettingsMessage extends ConfirmMessage {
	constructor(
		public readonly userSettings: UserSettings
	) {
		super();
	}
}
