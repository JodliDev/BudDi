import {BaseFrontendMessageAction} from "../BaseFrontendMessageAction";
import {Site} from "../../views/Site";
import {SessionLoginMessage} from "../../../../shared/messages/SessionLoginMessage";

export class IsAdminMessageAction extends BaseFrontendMessageAction<SessionLoginMessage> {
	exec(site: Site): void {
		site.isAdmin = true
	}
	
}
