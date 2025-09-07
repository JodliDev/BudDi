import {Class} from "../../../../shared/Class";
import {BasePublicTable} from "../../../../shared/BasePublicTable";
import m from "mithril";
import {Lang} from "../../../../shared/Lang";
import {Site} from "../Site";
import {DeleteMessage} from "../../../../shared/messages/DeleteMessage";
import {Btn} from "./Btn";

interface Attributes {
	site: Site,
	entryId: number | bigint,
	tableClass: Class<BasePublicTable>
	onDeleted?: () => void,
}

export default class DeleteEntry implements m.ClassComponent<Attributes> {
	private async deleteItem(options: Attributes) {
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
	
	view(vNode: m.Vnode<Attributes, unknown>): m.Vnode<any, unknown> {
		return <Btn.TooltipBtn iconKey="delete" description={Lang.get("deleteEntry")} onclick={() => this.deleteItem(vNode.attrs)}/>
	}
}
