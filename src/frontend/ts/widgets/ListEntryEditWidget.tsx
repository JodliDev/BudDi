import {Class} from "../../../shared/Class";
import {BasePublicTable} from "../../../shared/BasePublicTable";
import m, {Component, Vnode} from "mithril";
import {BindValueToInput} from "./BindValueToInput";
import {Lang, LangKey} from "../../../shared/Lang";
import {AddMessage} from "../../../shared/messages/AddMessage";
import {ListEntryResponseMessage} from "../../../shared/messages/ListEntryResponseMessage";
import {EditMessage} from "../../../shared/messages/EditMessage";
import {Site} from "../views/Site";
import {ListResponseEntry} from "../../../shared/messages/ListResponseMessage";
import {ConfirmMessage} from "../../../shared/messages/ConfirmMessage";
import {FeedbackCallBack, FeedbackIcon} from "./FeedbackIcon";

interface ListEntryEditComponentOptions<EntryT> {
	mode: "edit" | "add"
	site: Site, 
	tableClass: Class<EntryT>
	columns: (keyof EntryT)[],
	customInputView?: (key: keyof EntryT, value: EntryT[keyof EntryT], setValue: (value: EntryT[keyof EntryT]) => void) => Vnode | undefined,
	editId?: number | bigint,
	onFinish?: (newData: ListResponseEntry<EntryT>) => void,
	getValueError?: (key: keyof EntryT, value: unknown) => string | undefined
	defaults?: EntryT
}

export class ListEntryEditComponent<EntryT extends BasePublicTable> implements Component<ListEntryEditComponentOptions<EntryT>, unknown> {
	private feedback = new FeedbackCallBack()
	private invalidColumns: Record<string, string> = {}
	private data: Partial<EntryT> = {}
	
	getTypedInputView(data: Partial<EntryT>, column: keyof EntryT, options: ListEntryEditComponentOptions<EntryT>) {
		const tableClass = new options.tableClass()
		const obj = options.defaults ?? tableClass
		const entry = data[column] ?? obj[column]
		
		const setValue = (value: EntryT[keyof EntryT]) => {
			const errorMsg = options.getValueError && options.getValueError(column, value)
			if(errorMsg)
				this.invalidColumns[column.toString()] = errorMsg
			else if(this.invalidColumns.hasOwnProperty(column))
				delete this.invalidColumns[column.toString()]
			data[column] = value
		}
		
		if(options.customInputView) {
			const view = options.customInputView(column, entry, setValue)
			if(view)
				return view
		}
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
		
		const titleKey = tableClass.getTranslation(column as keyof EntryT)
		const descKey = `${titleKey}_desc`
		return <label>
			<small>{Lang.get(titleKey)}</small>
			{<input type={inputType} {...BindValueToInput(() => entry, setValue)}/>}
			<small class="vertical">
				{ Lang.has(descKey) && <div>{ Lang.getDynamic(descKey) }</div> }
				{ this.invalidColumns.hasOwnProperty(column) && <div class="warn">{ this.invalidColumns[column.toString()] }</div> }
			</small>
		</label>
	}
	
	private hasInvalidColumns(): boolean {
		for(const _ in this.invalidColumns) {
			return true
		}
		return false
	}
	
	private async onSubmit(options: ListEntryEditComponentOptions<EntryT>, e: SubmitEvent): Promise<void> {
		e.preventDefault()
		this.feedback.loading(true)
		m.redraw()
		if(options.mode == "edit")
			await this.sendEntry(options, new EditMessage(options.tableClass, options.editId ?? -1, this.data), "errorEdit")
		else
			await this.sendEntry(options, new AddMessage(options.tableClass, this.data), "errorAdd")
		
		this.feedback.loading(false)
		m.redraw()
	}
	
	private async sendEntry(options: ListEntryEditComponentOptions<EntryT>, message: ConfirmMessage, errorKey: LangKey): Promise<void> {
		const response = await options.site.socket.sendAndReceive(message) as ListEntryResponseMessage<EntryT>
		
		if(response.success)
			options.onFinish && options.onFinish(response.entry)
		else
			options.site.errorManager.error(Lang.get(errorKey))
		
		this.feedback.feedback(response.success)
	}
	
	view(vNode: Vnode<ListEntryEditComponentOptions<EntryT>, unknown>): Vnode {
		const isEditMode = vNode.attrs.mode == "edit"
		
		return <form onsubmit={this.onSubmit.bind(this, vNode.attrs)} class="vertical">
			{vNode.attrs.columns.map((column) => this.getTypedInputView(this.data, column, vNode.attrs))}
			
			<div class="horizontal hAlignEnd vAlignCenter">
				{FeedbackIcon(this.feedback, true)}
				<input disabled={this.hasInvalidColumns() || !this.feedback.isReady()} type="submit" value={Lang.get(isEditMode ? "change" : "add")}/>
			</div>
		</form>
	}
}
	
export function ListEntryEditWidget<EntryT extends BasePublicTable>(options: ListEntryEditComponentOptions<EntryT>): Vnode<ListEntryEditComponentOptions<EntryT>, unknown> {
	return m(ListEntryEditComponent<EntryT>, options)
}
