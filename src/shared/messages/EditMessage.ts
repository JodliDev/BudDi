import {Class} from "../Class";
import {BaseListEntry} from "../BaseListEntry";
import {ConfirmMessage} from "./ConfirmMessage";
import {BaseListMessage} from "../BaseListMessage";

export class EditMessage extends ConfirmMessage implements BaseListMessage {
	public readonly listName: string
	constructor(
		entryClass: Class<BaseListEntry>,
		public readonly id: number | bigint,
		public readonly values: Partial<BaseListEntry>
	) {
		super()
		this.listName = entryClass.name
	}
}
