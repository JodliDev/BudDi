import {Class} from "../Class";
import {BasePublicTable} from "../BasePublicTable";
import {BaseListMessage} from "../BaseListMessage";

export class EditMessage extends BaseListMessage {
	constructor(
		tableClass: Class<BasePublicTable>,
		public readonly id: number | bigint,
		public readonly values: Partial<BasePublicTable>
	) {
		super(tableClass)
	}
}
