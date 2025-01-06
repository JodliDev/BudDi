import {BaseFrontendMessageAction} from "../BaseFrontendMessageAction";
import {Site} from "../../views/Site";
import {ServerSettingsMessage} from "../../../../shared/messages/ServerSettingsMessage";
import m from "mithril";

export class ServerSettingsMessageAction extends BaseFrontendMessageAction<ServerSettingsMessage> {
	exec(site: Site): void {
		site.serverSettings = this.data.serverSettings
		m.redraw()
	}
}
