import {Class} from "../Class";
import {BasePublicTable} from "../BasePublicTable";
import {ConfirmMessage} from "./ConfirmMessage";

export class DeleteMessage extends ConfirmMessage {
	public readonly listName: string
	constructor(
		tableClass: Class<BasePublicTable>,
		public readonly id: number | bigint,
	) {
		super()
		this.listName = BasePublicTable.getName(tableClass)
	}
}
