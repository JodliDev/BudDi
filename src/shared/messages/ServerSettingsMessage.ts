import {BaseMessage} from "../BaseMessage";
import {ServerSettings} from "../ServerSettings";

export class ServerSettingsMessage extends BaseMessage {
	constructor(
		public readonly serverSettings: ServerSettings
	) {
		super();
	}
}
