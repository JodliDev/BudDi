import {ConfirmMessage} from "./ConfirmMessage";
import {BasePublicTable} from "../BasePublicTable";
import {Class} from "../Class";
import {BaseListMessage} from "../BaseListMessage";

export class ListMessage extends ConfirmMessage implements BaseListMessage{
	public readonly listName: string
	
	constructor(
		tableClass: Class<BasePublicTable>,
		public readonly from: number,
		public readonly limit: number,
		public readonly order?: string,
		public readonly orderType?: "ASC" | "DESC"
	) {
		super()
		this.listName = BasePublicTable.getName(tableClass)
	}
}
