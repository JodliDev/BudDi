import m, {Component, Vnode} from "mithril";
import {closeDropdown, dropdownIsOpened, DropdownMenu} from "../../widgets/DropdownMenu";
import {BtnWidget, ButtonType} from "../../widgets/BtnWidget";
import {Lang, LangKey} from "../../../../shared/Lang";
import {BindValueToInput} from "../../widgets/BindValueToInput";
import {FeedbackCallBack, FeedbackIcon} from "../../widgets/FeedbackIcon";
import {PubPayment} from "../../../../shared/public/PubPayment";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {Site} from "../Site";
import {BinaryUploadMessage} from "../../../../shared/messages/BinaryUploadMessage";


interface PaymentEditorComponentOptions {
	site: Site
	iconKey: keyof typeof ButtonType
	langKey: LangKey,
	amount: number
	fileExists?: boolean
	getMessage: (amount: number, deleteExistingFile: boolean, file: File | undefined) => BinaryUploadMessage,
	onFinish: (response: ConfirmResponseMessage, amount: number) => void
}
class PaymentEditorComponent implements Component<PaymentEditorComponentOptions, unknown> {
	private paymentAmount: number = 0
	private setPaidFeedback = new FeedbackCallBack()
	private fileExists = false
	
	private async onSend(options: PaymentEditorComponentOptions, event: SubmitEvent) {
		this.setPaidFeedback.loading(true)
		event.preventDefault()
		const target = event.target as HTMLFormElement
		const elements = target.elements
		const amountEl = elements.namedItem("amount") as HTMLInputElement
		const receiptEl = elements.namedItem("receipt") as HTMLInputElement
		const file = receiptEl.files ? receiptEl.files[0] as File : undefined
		
		if(file && file.size > PubPayment.RECEIPT_MAX_SIZE) {
			options.site.errorManager.error(Lang.get("errorFileTooBig", PubPayment.RECEIPT_MAX_SIZE / 1e+6))
			return
		}
		const amount = parseInt(amountEl.value) ?? 1
		const message = options.getMessage(amount, !this.fileExists, file)
		const response = await options.site.socket.sendAndReceive(message) as ConfirmResponseMessage
		
		this.setPaidFeedback.feedback(response.success)
		if(response.success)
			closeDropdown("paymentDialog")
		
		options.onFinish(response, amount)
	}
	
	oninit(vNode: Vnode<PaymentEditorComponentOptions, unknown>): void {
		const options = vNode.attrs
		this.paymentAmount = options.amount
		this.fileExists = options.fileExists!!
	}
	onupdate(vNode: Vnode<PaymentEditorComponentOptions, unknown>): any {
		if(dropdownIsOpened("paymentDialog"))
			return
		const options = vNode.attrs
		this.paymentAmount = options.amount
		this.fileExists = options.fileExists!!
	}
	
	view(vNode: Vnode<PaymentEditorComponentOptions, unknown>): Vnode<any, unknown> {
		const options = vNode.attrs
		return DropdownMenu(
			"paymentDialog",
			BtnWidget.PopoverBtn(options.iconKey, Lang.get(options.langKey)),
			() => <form class="vertical" onsubmit={this.onSend.bind(this, options)}>
				<label>
					<small>{Lang.get("amount")}</small>
					<input type="number" name="amount" min="0" {...BindValueToInput(() => this.paymentAmount, (value) => this.paymentAmount = value)}/>
				</label>
				<label>
					<small>{Lang.get("receipt")}</small>
					{this.fileExists
						? <span class="mainContent">{
							BtnWidget.PopoverBtn("delete", Lang.get("deleteRecipe"), () => {this.fileExists = false})
						}</span>
						: <input type="file" name="receipt"/>
					}
				
				</label>
				<div class="horizontal hAlignEnd vAlignCenter">
					{FeedbackIcon(this.setPaidFeedback, true)}
					<input disabled={!this.setPaidFeedback.isReady()} type="submit" value={Lang.get("save")} />
				</div>
			</form>
		)
	}
	
}

export function PaymentEditor(options: PaymentEditorComponentOptions): Vnode<PaymentEditorComponentOptions, unknown> {
	return m(PaymentEditorComponent, options)
}
