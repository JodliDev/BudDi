import {ConfirmResponseMessage} from "./ConfirmResponseMessage";
import {ListMessage} from "./ListMessage";
import {BaseListEntry} from "../BaseListEntry";

export class ListResponseMessage<T extends BaseListEntry> extends ConfirmResponseMessage {
	public readonly listName: string
	
	constructor(
		message: ListMessage,
		public readonly success: boolean,
		public readonly list: T[],
		public readonly idColumn: string,
		public readonly totalCount: number
	) {
		super(message, success)
		this.listName = message.listName
	}
}
