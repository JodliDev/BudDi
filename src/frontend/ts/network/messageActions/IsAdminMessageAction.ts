import {BaseFrontendMessageAction} from "../BaseFrontendMessageAction";
import {Site} from "../../views/Site";
import {IsAdminMessage} from "../../../../shared/messages/IsAdminMessage";

export class IsAdminMessageAction extends BaseFrontendMessageAction<IsAdminMessage> {
	exec(site: Site): void {
		site.loginState.setAdmin()
	}
	
}
