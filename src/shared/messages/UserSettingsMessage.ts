import {BaseMessage} from "../BaseMessage";
import {UserSettings} from "../UserSettings";

export class UserSettingsMessage extends BaseMessage {
	constructor(
		public readonly userSettings: UserSettings
	) {
		super();
	}
}
