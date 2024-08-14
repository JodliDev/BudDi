import {ConfirmResponseMessage} from "./ConfirmResponseMessage";
import {ListMessage} from "./ListMessage";
import {BaseListEntry} from "../BaseListEntry";
import {ConfirmMessage} from "./ConfirmMessage";

export class ListEntryResponseMessage<T extends BaseListEntry> extends ConfirmResponseMessage {
	constructor(
		message: ConfirmMessage,
		public readonly success: boolean,
		public readonly entry: T,
	) {
		super(message, success)
	}
}
