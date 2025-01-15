import {BaseFrontendMessageAction} from "../BaseFrontendMessageAction";
import {Site} from "../../views/Site";
import {ErrorMessage} from "../../../../shared/messages/ErrorMessage";
import {Lang} from "../../../../shared/Lang";

export class ErrorMessageAction extends BaseFrontendMessageAction<ErrorMessage> {
	exec(site: Site): void {
		site.errorManager.error(Lang.has(this.data.error) ? Lang.getDynamic(this.data.error) : this.data.error)
	}
}
