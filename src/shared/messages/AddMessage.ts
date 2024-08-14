import {Class} from "../Class";
import {BaseListEntry} from "../BaseListEntry";
import {ConfirmMessage} from "./ConfirmMessage";

export class AddMessage extends ConfirmMessage {
	public readonly listName: string
	constructor(
		entryClass: Class<BaseListEntry>,
		public readonly values: Partial<BaseListEntry>
	) {
		super()
		this.listName = entryClass.name
	}
}
