import {Class} from "../Class";
import {BasePublicTable} from "../BasePublicTable";
import {BaseListMessage} from "../BaseListMessage";

export class AddMessage extends BaseListMessage {
	constructor(
		tableClass: Class<BasePublicTable>,
		public readonly values: Partial<BasePublicTable>
	) {
		super(tableClass)
	}
}
