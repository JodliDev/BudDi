import {ConfirmMessage} from "./ConfirmMessage";
import {BaseListEntry} from "../BaseListEntry";
import {Class} from "../Class";
import {BaseListMessage} from "../BaseListMessage";

export class ListMessage extends ConfirmMessage implements BaseListMessage{
	public readonly listName: string
	
	constructor(
		entryClass: Class<BaseListEntry>,
		public readonly from: number,
		public readonly limit: number,
	) {
		super()
		this.listName = entryClass.name
	}
}
