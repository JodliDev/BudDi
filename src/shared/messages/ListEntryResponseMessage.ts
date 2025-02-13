import {ConfirmResponseMessage} from "./ConfirmResponseMessage";
import {ListMessage} from "./ListMessage";
import {BasePublicTable} from "../BasePublicTable";
import {ConfirmMessage} from "./ConfirmMessage";
import {ListResponseEntry} from "./ListResponseMessage";
import {JoinedResponseEntry} from "../JoinedResponseEntry";

export class ListEntryResponseMessage<T extends BasePublicTable> extends ConfirmResponseMessage {
	public readonly entry: ListResponseEntry<T>
	
	constructor(
		message: ConfirmMessage,
		public readonly success: boolean,
		entry: JoinedResponseEntry<T>,
	) {
		super(message, success)
		this.entry = entry as ListResponseEntry<T>
	}
}
