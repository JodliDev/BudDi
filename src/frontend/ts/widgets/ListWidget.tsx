import { PagesHelper } from "./PagesHelper";
import { BtnWidget } from "./BtnWidget";
import { Lang } from "../../../shared/Lang";
import { LoadingSpinner } from "./LoadingSpinner";
import "./ListHelper.css"
import {BaseListEntry} from "../../../shared/BaseListEntry";
import {Class} from "../../../shared/Class";
import {Site} from "../views/Site";
import {ListMessage} from "../../../shared/messages/ListMessage";
import {ListResponseMessage} from "../../../shared/messages/ListResponseMessage";
import {DeleteMessage} from "../../../shared/messages/DeleteMessage";
import {AddMessage} from "../../../shared/messages/AddMessage";
import {DropdownMenu} from "./DropdownMenu";
import m, {Component, Vnode, VnodeDOM} from "mithril";
import {EditMessage} from "../../../shared/messages/EditMessage";
import {ListEntryResponseMessage} from "../../../shared/messages/ListEntryResponseMessage";

const PAGE_SIZE = 25;

interface ListEditComponentOptions<EntryT> {
	listClass: Class<EntryT>
	columns: (keyof EntryT)[]
	onFinish: (data: Partial<any>) => Promise<void>,
	defaults?: EntryT
}

class ListEditComponent<EntryT extends BaseListEntry> implements Component<ListEditComponentOptions<EntryT>, unknown> {
	private isLoading: boolean = false
	private data: Partial<EntryT> = {}
	
	getTypedInputView(data: Partial<EntryT>, obj: EntryT, column: keyof EntryT) {
		const eventHandler = (formatValue: (value: string) => any, e: InputEvent) => {
			data[column] = formatValue((e.target as HTMLInputElement)?.value)
		}
		
		const entry = data[column] ?? obj[column]
		switch(typeof entry) {
			case "number":
				return <input type="number" value={entry} onchange={eventHandler.bind(this, value => parseInt(value))}/>
			case "string":
				return <input value={entry} onchange={eventHandler.bind(this, value => value.toString())}/>
		}
	}
	
	view(vNode: Vnode<ListEditComponentOptions<EntryT>, unknown>): Vnode {
		const obj = new vNode.attrs.listClass()

		return <form onsubmit={ async () => {
			this.isLoading = true
			m.redraw()
			await vNode.attrs.onFinish(this.data)
			this.isLoading = false
			m.redraw()
		}} class="vertical">
			{
				vNode.attrs.columns.map((column) => <label>
					<small>{Lang.getGrouped(obj.getTableName(), column.toString())}</small>
					{ this.getTypedInputView(this.data, vNode.attrs.defaults ?? obj, column) }
				</label>)
			}
			{ LoadingSpinner(this.isLoading) }
			<input disabled={this.isLoading} type="submit" value={Lang.get(vNode.attrs.defaults ? "change" : "add")}/>
		</form>;
	}
	
}


interface ListOptions<EntryT extends BaseListEntry> {
	site: Site
	listClass: Class<EntryT>
	title: string,
	getEntryView: (entry: EntryT) => Vnode,
	canDelete?: boolean
	addOptions?: (keyof EntryT)[]
	editOptions?: (keyof EntryT)[],
	pageSize?: number
}

class ListComponent<EntryT extends BaseListEntry> implements Component<ListOptions<EntryT>, unknown> {
	private items: EntryT[] = []
	private pagesHelper: PagesHelper = new PagesHelper(PAGE_SIZE, this.loadPage.bind(this))
	private idColumn?: keyof EntryT
	private isLoading: boolean = false
	private options?: ListOptions<EntryT>
	
	
	private async loadPage(pageNumber: number): Promise<void> {
		this.isLoading = true
		m.redraw()
		
		const pageSize = PAGE_SIZE
		const response = await this.options!.site.socket.sendAndReceive(
			new ListMessage(this.options!.listClass, pageNumber * pageSize, pageSize)
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
			new DeleteMessage(this.options!.listClass, id as number)
		)
		
		if(response.success) {
			this.items = this.items.filter((r) => this.getId(r) != id)
			m.redraw()
		}
		else
			this.options!.site.errorManager.error(Lang.get("errorDelete"))
	}
	
	private async addItem(data: Partial<EntryT>) {
		const response = await this.options!.site.socket.sendAndReceive(
			new AddMessage(this.options!.listClass, data)
		) as ListEntryResponseMessage<EntryT>
		
		if(response.success) {
			this.items.push(response.entry)
			m.redraw()
		}
		else
			this.options!.site.errorManager.error(Lang.get("errorAdd"))
	}
	
	private async editItem(id: number | bigint, data: Partial<EntryT>) {
		const response = await this.options!.site.socket.sendAndReceive(
			new EditMessage(this.options!.listClass, id, data)
		) as ListEntryResponseMessage<EntryT>
		
		if(response.success) {
			const index = this.items.findIndex(entry => this.getId(entry) == id)
			this.items[index] = response.entry
			m.redraw()
		}
		else
			this.options!.site.errorManager.error(Lang.get("errorAdd"))
	}
	
	public async oncreate(vNode: VnodeDOM<ListOptions<EntryT>, unknown>): Promise<void> {
		this.options = vNode.attrs
		await this.loadPage(this.pagesHelper.getCurrentPage())
	}
	
	view(vNode: Vnode<ListOptions<EntryT>, unknown>): Vnode {
		return <div class="listHelper surface vertical">
			<div class="subSurface horizontal hAlignCenter vAlignCenter">
				<b class="fillSpace horizontal hAlignCenter">{ vNode.attrs.title }</b>
					{ this.isLoading
						? LoadingSpinner(this.isLoading)
						: BtnWidget.Reload(this.loadPage.bind(this, this.pagesHelper.getCurrentPage()))
					}
				{ vNode.attrs.addOptions &&
					DropdownMenu(
						`Add~${vNode.attrs.listClass.name}`,
						BtnWidget.Add(),
						() => m(ListEditComponent<EntryT>, {
							listClass: vNode.attrs.listClass,
							columns: vNode.attrs.addOptions!,
							onFinish: this.addItem.bind(this)
						})
					)
				}
			</div>
			<div class={ `${this.isLoading ? "opacity" : ""} fillSpace subSurface vertical hAlignStretched overflowY textCentered` }>
				{ this.pagesHelper.isEmpty()
					? Lang.get("noEntries")
					: this.items.map((entry) => {
						return <div class="horizontal entry vAlignCenter">
							{ vNode.attrs.getEntryView(entry) }
							{ vNode.attrs.editOptions &&
								DropdownMenu(
									`Edit~${vNode.attrs.listClass.name}`,
									BtnWidget.Edit(),
									() => m(ListEditComponent<EntryT>, {
										listClass: vNode.attrs.listClass,
										columns: vNode.attrs.editOptions!,
										onFinish: this.editItem.bind(this, this.getId(entry)),
										defaults: entry
									})
								)
							
							}
							{ vNode.attrs.canDelete && BtnWidget.Delete(() => this.deleteItem(entry)) }
						</div>
					})
				}
			</div>
			{ !this.pagesHelper.isEmpty() && this.pagesHelper.getView() }
		</div>
	}
}


export function ListWidget<EntryT extends BaseListEntry>(options: ListOptions<EntryT>): Vnode<ListOptions<EntryT>, unknown> {
	return m(ListComponent<EntryT>, options)
}
