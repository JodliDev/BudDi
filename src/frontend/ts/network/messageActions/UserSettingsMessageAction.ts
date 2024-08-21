import {BaseFrontendMessageAction} from "../BaseFrontendMessageAction";
import {Site} from "../../views/Site";
import {UserSettingsMessage} from "../../../../shared/messages/UserSettingsMessage";

export class UserSettingsMessageAction extends BaseFrontendMessageAction<UserSettingsMessage> {
	exec(site: Site): void {
		site.setUserSettings(this.data.userSettings)
	}
}
