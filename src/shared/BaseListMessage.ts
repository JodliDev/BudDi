import {ConfirmMessage} from "./messages/ConfirmMessage";
import {Class} from "./Class";
import {BasePublicTable} from "./BasePublicTable";

export abstract class BaseListMessage extends ConfirmMessage {
	public readonly listName: string
	
	protected constructor(tableClass: Class<BasePublicTable>) {
		super()
		this.listName = this.getName(tableClass)
	}
	
	public getName(table: Class<BasePublicTable>): string {
		return table.name.startsWith("Pub") ? table.name.substring(3) : table.name
	}
}
