import {BaseFrontendMessageAction} from "../BaseFrontendMessageAction";
import {Site} from "../../views/Site";
import {IsLoggedInMessage} from "../../../../shared/messages/IsLoggedInMessage";

export class IsLoggedInMessageAction extends BaseFrontendMessageAction<IsLoggedInMessage> {
	exec(site: Site): void {
		site.login(this.data.loggedInData)
	}
	
}
