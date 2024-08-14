import {Class} from "../Class";
import {BasePublicTable} from "../BasePublicTable";
import {ConfirmMessage} from "./ConfirmMessage";
import {BaseListMessage} from "../BaseListMessage";

export class AddMessage extends ConfirmMessage implements BaseListMessage {
	public readonly listName: string
	constructor(
		tableClass: Class<BasePublicTable>,
		public readonly values: Partial<BasePublicTable>
	) {
		super()
		this.listName = BasePublicTable.getName(tableClass)
	}
}
