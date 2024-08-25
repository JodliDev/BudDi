import { PagesHelper } from "./PagesHelper";
import { BtnWidget } from "./BtnWidget";
import { Lang } from "../../../shared/Lang";
import { LoadingSpinner } from "./LoadingSpinner";
import "./ListWidget.css"
import {BasePublicTable} from "../../../shared/BasePublicTable";
import {Class} from "../../../shared/Class";
import {Site} from "../views/Site";
import {ListMessage} from "../../../shared/messages/ListMessage";
import {ListResponseEntry, ListResponseMessage} from "../../../shared/messages/ListResponseMessage";
import {DeleteMessage} from "../../../shared/messages/DeleteMessage";
import {AddMessage} from "../../../shared/messages/AddMessage";
import {closeDropdown, DropdownMenu} from "./DropdownMenu";
import m, {Component, Vnode, VnodeDOM} from "mithril";
import {EditMessage} from "../../../shared/messages/EditMessage";
import {ListEntryResponseMessage} from "../../../shared/messages/ListEntryResponseMessage";
import {BindValueToInput} from "./BindValueToInput";

const PAGE_SIZE = 25;

interface ListEditComponentOptions<EntryT> {
	editMode?: boolean
	tableClass: Class<EntryT>
	columns: (keyof EntryT)[]
	onFinish: (data: Partial<any>) => Promise<void>,
	defaults?: EntryT
}

class ListEditComponent<EntryT extends BasePublicTable> implements Component<ListEditComponentOptions<EntryT>, unknown> {
	private isLoading: boolean = false
	private data: Partial<EntryT> = {}
	
	getTypedInputView(data: Partial<EntryT>, type: string, obj: EntryT, column: keyof EntryT) {
		const entry = data[column] ?? obj[column]
		let inputType: string
		switch(typeof entry) {
			case "number":
				inputType = "number"
				break
			case "boolean":
				inputType = "checkbox"
				break
			default:
				inputType = "text"
		}
		return <input type={inputType} { ...BindValueToInput(() => entry, value => data[column] = value) }/>
	}
	
	view(vNode: Vnode<ListEditComponentOptions<EntryT>, unknown>): Vnode {
		const obj = new vNode.attrs.tableClass()

		return <form onsubmit={ async (e: SubmitEvent) => {
			e.preventDefault()
			this.isLoading = true
			m.redraw()
			await vNode.attrs.onFinish(this.data)
			this.isLoading = false
			m.redraw()
		}} class="vertical">
			{
				vNode.attrs.columns.map((column) => <label>
					<small>{Lang.getGrouped(BasePublicTable.getName(vNode.attrs.tableClass), column.toString())}</small>
					{ this.getTypedInputView(this.data, typeof obj[column], vNode.attrs.defaults ?? obj, column) }
				</label>)
			}
			{ LoadingSpinner(this.isLoading) }
			<input disabled={this.isLoading} type="submit" value={Lang.get(vNode.attrs.editMode ? "change" : "add")}/>
		</form>;
	}
	
}

export class ListWidgetCallback {
	reload: () => Promise<void> = () => Promise.resolve()
	isEmpty: () => boolean = () => true
}

interface ListOptions<EntryT extends BasePublicTable> {
	site: Site
	tableClass: Class<EntryT>
	title: string,
	getEntryView: (entry: ListResponseEntry<EntryT>) => Vnode,
	hideRefresh?: boolean
	deleteOptions?: { onDeleted?: () => void },
	addOptions?: { columns: (keyof EntryT)[], onAdded?: () => void }
	editOptions?: { columns: (keyof EntryT)[], onChanged?: () => void },
	pageSize?: number
	order?: keyof EntryT,
	orderType?: "ASC" | "DESC"
	callback?: ListWidgetCallback
}

class ListComponent<EntryT extends BasePublicTable> implements Component<ListOptions<EntryT>, unknown> {
	private items: ListResponseEntry<EntryT>[] = []
	private pagesHelper: PagesHelper = new PagesHelper(PAGE_SIZE, this.loadPage.bind(this))
	private idColumn?: keyof EntryT
	private isLoading: boolean = false
	private options?: ListOptions<EntryT>
	
	
	private async loadPage(pageNumber: number = this.pagesHelper.getCurrentPage()): Promise<void> {
		const options = this.options!
		this.isLoading = true
		m.redraw()
		
		const pageSize = PAGE_SIZE
		const response = await this.options!.site.socket.sendAndReceive(
			new ListMessage(options.tableClass, pageNumber * pageSize, pageSize, options.order ? options.order.toString() : undefined, options.orderType)
		)
		const listMessage = response as ListResponseMessage<EntryT>
		if(!listMessage.success) {
			this.options!.site.errorManager.error(Lang.get("errorList"))
			return
		}
		
		this.items = listMessage.list
		this.pagesHelper.setTotalCount(listMessage.totalCount)
		this.idColumn = listMessage.idColumn as keyof EntryT
		this.isLoading = false
		m.redraw()
	}
	
	private getId(entry: EntryT): number {
		const idColumn = this.idColumn
		if(!idColumn)
			return -1
		
		return entry[idColumn] as number
	}
	
	private async deleteItem(entry: EntryT) {
		if(!confirm(Lang.get("confirmDelete")))
			return
		const id = this.getId(entry)
		const response = await this.options!.site.socket.sendAndReceive(
			new DeleteMessage(this.options!.tableClass, id as number)
		)
		
		if(response.success) {
			this.items = this.items.filter((r) => this.getId(r.item) != id)
			this.options?.deleteOptions?.onDeleted && this.options?.deleteOptions?.onDeleted()
			m.redraw()
		}
		else
			this.options!.site.errorManager.error(Lang.get("errorDelete"))
	}
	
	private async addItem(data: Partial<EntryT>) {
		const options = this.options!
		const response = await options.site.socket.sendAndReceive(
			new AddMessage(options.tableClass, data)
		) as ListEntryResponseMessage<EntryT>
		
		if(response.success) {
			this.items.push(response.entry)
			options.addOptions?.onAdded && options.addOptions?.onAdded()
			closeDropdown(`Add~${BasePublicTable.getName(options.tableClass)}`)
			m.redraw()
		}
		else
			this.options!.site.errorManager.error(Lang.get("errorAdd"))
	}
	
	private async editItem(id: number | bigint, data: Partial<EntryT>) {
		const options = this.options!
		const response = await options.site.socket.sendAndReceive(
			new EditMessage(options.tableClass, id, data)
		) as ListEntryResponseMessage<EntryT>
		
		if(response.success) {
			const index = this.items.findIndex(entry => this.getId(entry.item) == id)
			this.items[index] = response.entry
			options.editOptions?.onChanged && options.editOptions?.onChanged()
			closeDropdown(`Edit~${BasePublicTable.getName(options.tableClass)}`)
			m.redraw()
		}
		else
			this.options!.site.errorManager.error(Lang.get("errorAdd"))
	}
	
	public async oncreate(vNode: VnodeDOM<ListOptions<EntryT>, unknown>): Promise<void> {
		this.options = vNode.attrs
		if(this.options.callback) {
			this.options.callback.reload = this.loadPage.bind(this)
			this.options.callback.isEmpty = this.pagesHelper.isEmpty.bind(this.pagesHelper)
		}
		await this.loadPage()
	}
	
	view(vNode: Vnode<ListOptions<EntryT>, unknown>): Vnode {
		const options = vNode.attrs
		return <div class="listWidget surface vertical">
			<h3 class="header horizontal hAlignCenter vAlignCenter">
				<b class="fillSpace horizontal hAlignCenter">{ options.title }</b>
					{ this.isLoading
						? LoadingSpinner(this.isLoading)
						: (options.hideRefresh ? "" : BtnWidget.Reload(this.loadPage.bind(this, this.pagesHelper.getCurrentPage())))
					}
				{ options.addOptions &&
					DropdownMenu(
						`Add~${BasePublicTable.getName(options.tableClass)}`,
						BtnWidget.Add(),
						() => m(ListEditComponent<EntryT>, {
							tableClass: options.tableClass,
							columns: options.addOptions!.columns,
							onFinish: this.addItem.bind(this),
						})
					)
				}
			</h3>
			<div class={ `${this.isLoading ? "opacity" : ""} fillSpace subSurface vertical hAlignStretched overflowY textCentered` }>
				{ this.pagesHelper.isEmpty()
					? Lang.get("noEntries")
					: this.items.map((entry) => {
						return <div class="horizontal entry vAlignCenter">
							{ options.getEntryView(entry) }
							{ options.editOptions &&
								DropdownMenu(
									`Edit~${BasePublicTable.getName(options.tableClass)}`,
									BtnWidget.Edit(),
									() => m(ListEditComponent<EntryT>, {
										editMode: true,
										tableClass: options.tableClass,
										columns: options.editOptions!.columns,
										onFinish: this.editItem.bind(this, this.getId(entry.item)),
										defaults: entry.item
									})
								)
							
							}
							{ options.deleteOptions && BtnWidget.Delete(() => this.deleteItem(entry.item)) }
						</div>
					})
				}
			</div>
			{ this.pagesHelper.isNeeded() && this.pagesHelper.getView() }
		</div>
	}
}


export function ListWidget<EntryT extends BasePublicTable>(options: ListOptions<EntryT>): Vnode<ListOptions<EntryT>, unknown> {
	return m(ListComponent<EntryT>, options)
}
