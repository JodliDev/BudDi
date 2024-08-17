import {ConfirmResponseMessage} from "./ConfirmResponseMessage";
import {ListMessage} from "./ListMessage";
import {BasePublicTable} from "../BasePublicTable";

export interface ListResponseEntry<T> {
	item: T,
	joined: Record<string, unknown>
}

export class ListResponseMessage<T extends BasePublicTable> extends ConfirmResponseMessage {
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
