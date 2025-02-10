import {Class} from "../Class";
import {BasePublicTable} from "../BasePublicTable";
import {BaseListMessage} from "../BaseListMessage";

export class EditMessage extends BaseListMessage {
	public readonly listName: string
	constructor(
		tableClass: Class<BasePublicTable>,
		public readonly id: number | bigint,
		public readonly values: Partial<BasePublicTable>
	) {
		super()
		this.listName = BasePublicTable.getName(tableClass)
	}
}
