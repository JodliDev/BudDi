import {ConfirmResponseMessage} from "./ConfirmResponseMessage";
import {ListMessage} from "./ListMessage";
import {BaseListEntry} from "../BaseListEntry";

export interface ListResponseEntry<T> {
	entry: T,
	joined: Record<string, unknown>
}

export class ListResponseMessage<T extends BaseListEntry> extends ConfirmResponseMessage {
	public readonly listName: string
	
	constructor(
		message: ListMessage,
		public readonly success: boolean,
		public readonly list: ListResponseEntry<T>[],
		public readonly idColumn: string,
		public readonly totalCount: number
	) {
		super(message, success)
		this.listName = message.listName
	}
}
