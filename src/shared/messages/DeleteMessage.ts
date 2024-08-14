import {Class} from "../Class";
import {BaseListEntry} from "../BaseListEntry";
import {ConfirmMessage} from "./ConfirmMessage";

export class DeleteMessage extends ConfirmMessage {
	public readonly listName: string
	constructor(
		entryClass: Class<BaseListEntry>,
		public readonly id: number,
	) {
		super()
		this.listName = entryClass.name
	}
}
