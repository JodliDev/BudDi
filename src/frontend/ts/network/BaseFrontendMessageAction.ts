import {Site} from "../views/Site";
import {BaseMessage} from "../../../shared/BaseMessage";

export abstract class BaseFrontendMessageAction<T extends BaseMessage> {
	public abstract exec(site: Site): void
	
	constructor(protected data: T) { }
}
