import {Class} from "../Class";
import {BasePublicTable} from "../BasePublicTable";
import {BaseListMessage} from "../BaseListMessage";

export class DeleteMessage extends BaseListMessage {
	constructor(
		tableClass: Class<BasePublicTable>,
		public readonly id: number | bigint,
	) {
		super(tableClass)
	}
}
