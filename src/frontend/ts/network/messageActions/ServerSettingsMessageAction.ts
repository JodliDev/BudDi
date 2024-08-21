import {BaseFrontendMessageAction} from "../BaseFrontendMessageAction";
import {Site} from "../../views/Site";
import {SessionLoginMessage} from "../../../../shared/messages/SessionLoginMessage";
import {ServerSettingsMessage} from "../../../../shared/messages/ServerSettingsMessage";

export class ServerSettingsMessageAction extends BaseFrontendMessageAction<ServerSettingsMessage> {
	exec(site: Site): void {
		site.serverSettings = this.data.serverSettings
	}
}
