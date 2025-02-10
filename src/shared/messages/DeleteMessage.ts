import {Class} from "../Class";
import {BasePublicTable} from "../BasePublicTable";
import {BaseListMessage} from "../BaseListMessage";

export class DeleteMessage extends BaseListMessage {
	public readonly listName: string
	constructor(
		tableClass: Class<BasePublicTable>,
		public readonly id: number | bigint,
	) {
		super()
		this.listName = BasePublicTable.getName(tableClass)
	}
}
