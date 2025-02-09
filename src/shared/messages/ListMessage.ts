import {ConfirmMessage} from "./ConfirmMessage";
import {BasePublicTable} from "../BasePublicTable";
import {Class} from "../Class";
import {BaseListMessage} from "../BaseListMessage";
import {ListFilter} from "../ListFilter";

export class ListMessage extends ConfirmMessage implements BaseListMessage{
	public readonly listName: string
	
	constructor(
		tableClass: Class<BasePublicTable>,
		public readonly from: number,
		public readonly limit: number,
		public readonly order?: string,
		public readonly orderType?: "ASC" | "DESC",
		public readonly filter?: ListFilter
	) {
		super()
		this.listName = BasePublicTable.getName(tableClass)
	}
}
