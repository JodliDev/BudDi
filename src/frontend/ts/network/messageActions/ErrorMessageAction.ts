import {BaseFrontendMessageAction} from "../BaseFrontendMessageAction";
import {Site} from "../../views/Site";
import {SessionLoginMessage} from "../../../../shared/messages/SessionLoginMessage";
import {ErrorMessage} from "../../../../shared/messages/ErrorMessage";

export class ErrorMessageAction extends BaseFrontendMessageAction<ErrorMessage> {
	exec(site: Site): void {
		site.errorManager.error(this.data.error)
	}
	
}
