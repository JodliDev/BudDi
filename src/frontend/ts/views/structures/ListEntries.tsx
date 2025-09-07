import {Lang} from "../../../../shared/Lang";
import "./listEntries.css"
import {BasePublicTable} from "../../../../shared/BasePublicTable";
import {Class} from "../../../../shared/Class";
import {Site} from "../Site";
import {ListMessage} from "../../../../shared/messages/ListMessage";
import {ListResponseEntry, ListResponseMessage} from "../../../../shared/messages/ListResponseMessage";
import m, {ClassComponent, Vnode, VnodeDOM} from "mithril";
import EditEntry from "./EditEntry";
import {ListFilterData} from "../../../../shared/ListFilter";
import DeleteEntry from "./DeleteEntry";
import PageNumbers, {PageNumberFeedback} from "./PageNumbers";
import { Btn } from "./Btn";
import floatingMenu, {closeFloatingMenu} from "./floatingMenu";
import LoadingSpinner from "./LoadingSpinner";
import {PAGE_SIZE} from "../../Constants";
import {TsClosureComponent} from "../../../mithril-polyfill";

export class ListCallback {
	reload: () => Promise<void> = () => Promise.resolve()
	isEmpty: () => boolean = () => true
}

interface Attributes<EntryT extends BasePublicTable> {
	site: Site
	tableClass: Class<EntryT>
	title: string,
	AddFirstLineView?: () => Vnode,
	AddSubHeader?: () => Vnode,
	getEntryView: (entry: ListResponseEntry<EntryT>) => Vnode<any, unknown> | Vnode<any, unknown>[],
	hideRefresh?: boolean
	deleteOptions?: {onDeleted?: () => void},
	addOptions?: {
		columns: (keyof EntryT)[],
		onAdded?: () => void,
		customInputView?: (key: keyof EntryT, value: EntryT[keyof EntryT], setValue: (value: EntryT[keyof EntryT]) => void) => Vnode<any, any> | undefined,
		getValueError?: (key: keyof EntryT, value: unknown) => string | undefined
	}
	editOptions?: {
		columns: (keyof EntryT)[],
		onChanged?: () => void,
		customInputView?: (key: keyof EntryT, value: EntryT[keyof EntryT], setValue: (value: EntryT[keyof EntryT]) => void) => Vnode<any, any> | undefined,
		getValueError?: (key: keyof EntryT, value: unknown) => string | undefined
	},
	customHeaderOptions?: Vnode<any, unknown>
	pageSize?: number
	order?: (keyof EntryT | string)
	orderType?: "ASC" | "DESC",
	filter?: ListFilterData,
	callback?: ListCallback
}


function ListEntries<EntryT extends BasePublicTable>(vNode: m.Vnode<Attributes<EntryT>>) {
	const pageNumberFeedback = new PageNumberFeedback()
	
	let options = vNode.attrs
	let isLoading: boolean = false
	let items: ListResponseEntry<EntryT>[] = []
	let idColumn: keyof EntryT
	
	async function load(pageNumber: number = 0) {
		isLoading = true
		m.redraw()
		
		const pageSize = PAGE_SIZE
		const response = await options.site.socket.sendAndReceive(
			new ListMessage(options.tableClass, pageNumber * pageSize, pageSize, options.filter, options.order ? options.order.toString() : undefined, options.orderType)
		)
		const listMessage = response as ListResponseMessage<EntryT>;
		if(!listMessage.success) {
			options.site.errorManager.error(Lang.get("errorList"))
			return listMessage.totalCount
		}
		
		items = listMessage.list
		idColumn = listMessage.idColumn as keyof EntryT
		isLoading = false
		m.redraw()
		return listMessage.totalCount
	}
	async function addItem(newData: ListResponseEntry<EntryT>) {
		items.push(newData)
		options.addOptions?.onAdded && options.addOptions?.onAdded()
		closeFloatingMenu(`Add~${options.tableClass.name}`)
		m.redraw()
	}
	async function editItem(id: number | bigint, newData: ListResponseEntry<EntryT>) {
		const index = items.findIndex(entry => getId(entry.item) == id)
		items[index] = newData
		options.editOptions?.onChanged && options.editOptions?.onChanged()
		closeFloatingMenu(`Edit~${options.tableClass.name}`)
		m.redraw()
	}
	function getId(entry: EntryT): number | bigint {
		if(!idColumn)
			return -1
		
		return entry[idColumn] as number | bigint
	}
	
	return {
		view: (vNode: m.VnodeDOM<Attributes<EntryT>>) => {
			return <div class="ListEntries surface vertical">
				<h3 class="header horizontal hAlignCenter vAlignCenter">
					<b class="fillSpace horizontal hAlignCenter">{options.title}</b>
					{isLoading
						? <LoadingSpinner/>
						: options.hideRefresh ? "" : <Btn.Default iconKey={"reload"} onclick={() => pageNumberFeedback.reload()}/>
					}
					{options.addOptions &&
						<Btn.TooltipBtn
							iconKey="add"
							description={Lang.get("addEntry")}
							{... floatingMenu(
								`Add~${options.tableClass.name}`,
								() => <EditEntry<EntryT>
									mode="add"
									site={options.site}
									tableClass={options.tableClass}
									columns={options.addOptions!.columns}
									onFinish={addItem}
									customInputView={options.addOptions!.customInputView}
									getValueError={options.addOptions!.getValueError}
								/>
							)}
						/>
					}
					{options.customHeaderOptions && options.customHeaderOptions}
				</h3>
				{options.AddSubHeader && options.AddSubHeader()}
				<div class={`${isLoading ? "opacity" : ""} content fillSpace subSurface vertical hAlignStretched textCentered`}>
					{!items.length
						? Lang.get("noEntries")
						: [
							options.AddFirstLineView && options.AddFirstLineView(),
							...items.map((entry) => {
								const id = getId(entry.item)
								
								return <div class="horizontal entry vAlignCenter">
									{options.getEntryView(entry)}
									{options.editOptions &&
										<Btn.TooltipBtn
											iconKey="edit"
											description={Lang.get("changeEntryInfo")}
											{... floatingMenu(
												`Edit~${options.tableClass.name}`,
												() => <EditEntry<EntryT>
													mode="edit"
													site={options.site}
													editId={id}
													tableClass={options.tableClass}
													columns={options.editOptions!.columns}
													onFinish={editItem}
													customInputView={options.editOptions!.customInputView}
													getValueError={options.editOptions!.getValueError}
													defaults={entry.item}
												/>
											)}
										/>
									}
									{options.deleteOptions &&
										<DeleteEntry
											site={options.site}
											entryId={getId(entry.item)}
											tableClass={options.tableClass}
											onDeleted={() => {
												items = items.filter((r) => getId(r.item) != id)
												options.deleteOptions?.onDeleted?.()
												m.redraw()
											}}
										/>
									}
								</div>
							})
						]
					}
				</div>
				<PageNumbers loadPage={load} feedback={pageNumberFeedback}/>
			</div>
		},
		onupdate: (vNode: m.VnodeDOM<Attributes<EntryT>>) => {
			function needsReset(oldOptions: Attributes<EntryT>, newOptions: Attributes<EntryT>): boolean {
				return oldOptions.tableClass != newOptions.tableClass
					|| oldOptions.order != newOptions.order
					|| oldOptions.orderType != newOptions.orderType
					|| !!oldOptions.filter != !!newOptions.filter
					|| (!!newOptions.filter && !oldOptions.filter?.isSame(newOptions.filter))
			}
			if(needsReset(options, vNode.attrs)) {
				options = vNode.attrs
				items = []
				pageNumberFeedback.reload(0)
			}
		}
	};
}
export default TsClosureComponent(ListEntries);

class ListEntries2<EntryT extends BasePublicTable> implements ClassComponent<Attributes<EntryT>> {
	private items: ListResponseEntry<EntryT>[] = []
	private idColumn?: keyof EntryT
	private isLoading: boolean = false
	private options?: Attributes<EntryT>
	private pageNumberFeedback = new PageNumberFeedback()
	
	
	private async loadPage(pageNumber: number = 0): Promise<number> {
		console.log(this.options)
		const options = this.options!
		this.isLoading = true
		m.redraw()
		
		const pageSize = PAGE_SIZE
		const response = await options.site.socket.sendAndReceive(
			new ListMessage(options.tableClass, pageNumber * pageSize, pageSize, options.filter, options.order ? options.order.toString() : undefined, options.orderType)
		)
		const listMessage = response as ListResponseMessage<EntryT>
		if(!listMessage.success) {
			this.options!.site.errorManager.error(Lang.get("errorList"))
			return listMessage.totalCount
		}
		
		this.items = listMessage.list
		this.idColumn = listMessage.idColumn as keyof EntryT
		this.isLoading = false
		m.redraw()
		return listMessage.totalCount
	}
	
	private needsReset(oldOptions: Attributes<EntryT>, newOptions: Attributes<EntryT>): boolean {
		return oldOptions.tableClass != newOptions.tableClass
			|| oldOptions.order != newOptions.order
			|| oldOptions.orderType != newOptions.orderType
			|| !!oldOptions.filter != !!newOptions.filter
			|| (!!newOptions.filter && !oldOptions.filter?.isSame(newOptions.filter))
	}
	
	private getId(entry: EntryT): number | bigint {
		const idColumn = this.idColumn
		if(!idColumn)
			return -1
		
		return entry[idColumn] as number | bigint
	}
	
	private async addItem(newData: ListResponseEntry<EntryT>) {
		const options = this.options!
		
		this.items.push(newData)
		options.addOptions?.onAdded && options.addOptions?.onAdded()
		closeFloatingMenu(`Add~${options.tableClass.name}`)
		m.redraw()
	}
	
	private async editItem(id: number | bigint, newData: ListResponseEntry<EntryT>) {
		const options = this.options!
		
		const index = this.items.findIndex(entry => this.getId(entry.item) == id)
		this.items[index] = newData
		options.editOptions?.onChanged && options.editOptions?.onChanged()
		closeFloatingMenu(`Edit~${options.tableClass.name}`)
		m.redraw()
	}
	
	private setOptions(vNode: Vnode<Attributes<EntryT>, unknown>): void {
		this.options = vNode.attrs
		if(this.options.callback) {
			this.options.callback.reload = async () => this.pageNumberFeedback.reload()
			this.options.callback.isEmpty = () => !this.items.length
		}
		console.log(this.options)
	}
	
	public async oncreate(vNode: Vnode<Attributes<EntryT>, unknown>): Promise<void> {
		this.setOptions(vNode)
		// await this.pageNumberFeedback.reload()
	}
	public onbeforeupdate(newNode: Vnode<Attributes<EntryT>, unknown>, oldNode: VnodeDOM<Attributes<EntryT>, unknown>): void {
		this.setOptions(newNode)
		if(this.needsReset(oldNode.attrs, newNode.attrs)) {
			this.items = []
			this.pageNumberFeedback.reload(0)
		}
	}
	
	view(vNode: Vnode<Attributes<EntryT>, unknown>): Vnode {
		const options = vNode.attrs
		return <div class="ListEntries surface vertical">
			<h3 class="header horizontal hAlignCenter vAlignCenter">
				<b class="fillSpace horizontal hAlignCenter">{options.title}</b>
					{this.isLoading
						? <LoadingSpinner/>
						: options.hideRefresh ? "" : <Btn.Default iconKey={"reload"} onclick={() => this.pageNumberFeedback.reload()}/>
					}
				{options.addOptions &&
					<Btn.TooltipBtn
						iconKey="add"
						description={Lang.get("addEntry")}
						{... floatingMenu(
							`Add~${options.tableClass.name}`,
							() => <EditEntry<EntryT>
								mode="add"
								site={options.site}
								tableClass={options.tableClass}
								columns={options.addOptions!.columns}
								onFinish={this.addItem.bind(this)}
								customInputView={options.addOptions!.customInputView}
								getValueError={options.addOptions!.getValueError}
							/>
						)}
					/>
				}
				{options.customHeaderOptions && options.customHeaderOptions}
			</h3>
			{options.AddSubHeader && options.AddSubHeader()}
			<div class={`${this.isLoading ? "opacity" : ""} content fillSpace subSurface vertical hAlignStretched textCentered`}>
				{!this.items.length
					? Lang.get("noEntries")
					: [
						options.AddFirstLineView && options.AddFirstLineView(), 
						...this.items.map((entry) => {
							const id = this.getId(entry.item)
						
							return <div class="horizontal entry vAlignCenter">
								{options.getEntryView(entry)}
								{options.editOptions &&
									<Btn.TooltipBtn
										iconKey="edit"
										description={Lang.get("changeEntryInfo")}
										{... floatingMenu(
											`Edit~${options.tableClass.name}`,
											() => <EditEntry<EntryT>
												mode="edit"
												site={options.site}
												editId={id}
												tableClass={options.tableClass}
												columns={options.editOptions!.columns}
												onFinish={this.editItem.bind(this)}
												customInputView={options.editOptions!.customInputView}
												getValueError={options.editOptions!.getValueError}
												defaults={entry.item}
											/>
										)}
									/>
								}
								{options.deleteOptions &&
									<DeleteEntry
										site={options.site}
										entryId={this.getId(entry.item)}
										tableClass={options.tableClass}
										onDeleted={() => {
											this.items = this.items.filter((r) => this.getId(r.item) != id)
											this.options?.deleteOptions?.onDeleted && this.options?.deleteOptions?.onDeleted()
											m.redraw()
										}}
									/>
								}
							</div>
						})
					]
				}
			</div>
			<PageNumbers loadPage={this.loadPage.bind(this)} feedback={this.pageNumberFeedback}/>
		</div>
	}
}
