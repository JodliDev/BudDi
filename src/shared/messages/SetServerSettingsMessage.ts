import {ServerSettings} from "../ServerSettings";
import {ConfirmMessage} from "./ConfirmMessage";

export class SetServerSettingsMessage extends ConfirmMessage {
	constructor(
		public readonly serverSettings: ServerSettings
	) {
		super();
	}
}
