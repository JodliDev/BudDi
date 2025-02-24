import {BasePublicTable} from "../BasePublicTable";
import {Class} from "../Class";
import {BaseListMessage} from "../BaseListMessage";
import {ListFilterData} from "../ListFilter";

export class ListMessage extends BaseListMessage {
	constructor(
		tableClass: Class<BasePublicTable>,
		public readonly from: number,
		public readonly limit: number,
		public readonly filter?: ListFilterData,
		public readonly order?: string,
		public readonly orderType?: "ASC" | "DESC",
	) {
		super(tableClass)
	}
}
