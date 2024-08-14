import {ConfirmResponseMessage} from "./ConfirmResponseMessage";
import {ListMessage} from "./ListMessage";
import {BaseListEntry} from "../BaseListEntry";
import {ConfirmMessage} from "./ConfirmMessage";
import {ListResponseEntry} from "./ListResponseMessage";

export class ListEntryResponseMessage<T extends BaseListEntry> extends ConfirmResponseMessage {
	constructor(
		message: ConfirmMessage,
		public readonly success: boolean,
		public readonly entry: ListResponseEntry<T>,
	) {
		super(message, success)
	}
}
