import {ConfirmResponseMessage} from "./ConfirmResponseMessage";
import {ListMessage} from "./ListMessage";
import {BasePublicTable} from "../BasePublicTable";
import {ConfirmMessage} from "./ConfirmMessage";
import {ListResponseEntry} from "./ListResponseMessage";

export class ListEntryResponseMessage<T extends BasePublicTable> extends ConfirmResponseMessage {
	constructor(
		message: ConfirmMessage,
		public readonly success: boolean,
		public readonly entry: ListResponseEntry<T>,
	) {
		super(message, success)
	}
}
