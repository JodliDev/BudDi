import {BaseFrontendMessageAction} from "../BaseFrontendMessageAction";
import {Site} from "../../views/Site";
import {SessionLoginMessage} from "../../../../shared/messages/SessionLoginMessage";

export class SessionLoginMessageAction extends BaseFrontendMessageAction<SessionLoginMessage> {
	exec(site: Site): void {
		site.login(this.data.userId, this.data.sessionHash)
	}
	
}
