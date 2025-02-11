import {Class} from "../../../shared/Class";
import {BasePublicTable} from "../../../shared/BasePublicTable";
import m, {Component, Vnode} from "mithril";
import {Lang} from "../../../shared/Lang";
import {Site} from "../views/Site";
import {DeleteMessage} from "../../../shared/messages/DeleteMessage";
import {BtnWidget} from "./BtnWidget";

interface DeleteEntryComponentOptions {
	site: Site,
	entryId: number | bigint,
	tableClass: Class<BasePublicTable>
	onDeleted?: () => void,
}

class DeleteEntryComponent implements Component<DeleteEntryComponentOptions, unknown> {
	private async deleteItem(options: DeleteEntryComponentOptions) {
		if(!confirm(Lang.get("confirmDelete")))
			return
		const response = await options.site.socket.sendAndReceive(
			new DeleteMessage(options.tableClass, options.entryId)
		)
		
		if(response.success)
			options.onDeleted && options.onDeleted()
		else
			options.site.errorManager.error(Lang.get("errorDelete"))
	}
	
	view(vNode: Vnode<DeleteEntryComponentOptions, unknown>): Vnode<any, unknown> {
		return BtnWidget.PopoverBtn("delete", Lang.get("deleteEntryInfo"), () => this.deleteItem(vNode.attrs))
	}
}
	
export function DeleteEntryWidget(options: DeleteEntryComponentOptions): Vnode<DeleteEntryComponentOptions, unknown> {
	return m(DeleteEntryComponent, options)
}
