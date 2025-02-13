import {ConfirmResponseMessage} from "./ConfirmResponseMessage";
import {ListMessage} from "./ListMessage";
import {BasePublicTable} from "../BasePublicTable";
import {JoinedResponseEntry} from "../JoinedResponseEntry";

export interface ListResponseEntry<T extends BasePublicTable> extends JoinedResponseEntry<T> {
	item: T
}

export class ListResponseMessage<T extends BasePublicTable> extends ConfirmResponseMessage {
	public readonly listName: string
	public readonly list: ListResponseEntry<T>[]
	
	constructor(
		message: ListMessage,
		public readonly success: boolean,
		list: JoinedResponseEntry<T>[],
		public readonly idColumn: string,
		public readonly totalCount: number
	) {
		super(message, success)
		this.listName = message.listName
		this.list = list as ListResponseEntry<T>[]
	}
}
