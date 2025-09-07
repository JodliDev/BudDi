import m from "mithril";
import {Lang, LangKey} from "../../../../shared/Lang";
import bindValueToInput from "./bindValueToInput";
import FeedbackIcon, {FeedbackCallBack} from "./FeedbackIcon";
import {PubPayment} from "../../../../shared/public/PubPayment";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {Site} from "../Site";
import {BinaryUploadMessage} from "../../../../shared/messages/BinaryUploadMessage";
import {Btn} from "./Btn";
import floatingMenu, {closeFloatingMenu, floatingMenuIsOpened} from "./floatingMenu";
import {IconType} from "./Icon";


interface Attributes {
	site: Site
	iconKey: keyof typeof IconType
	langKey: LangKey,
	amount: number
	fileExists?: boolean
	getMessage: (amount: number, deleteExistingFile: boolean, file: File | undefined) => BinaryUploadMessage,
	onFinish: (response: ConfirmResponseMessage, amount: number) => void
}
export default class PaymentEditor implements m.ClassComponent<Attributes> {
	private paymentAmount: number = 0
	private setPaidFeedback = new FeedbackCallBack()
	private fileExists = false
	
	private async onSend(options: Attributes, event: SubmitEvent) {
		this.setPaidFeedback.setLoading(true)
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
		
		this.setPaidFeedback.setSuccess(response.success)
		if(response.success)
			closeFloatingMenu("paymentDialog")
		
		options.onFinish(response, amount)
	}
	
	oninit(vNode: m.Vnode<Attributes, unknown>): void {
		const options = vNode.attrs
		this.paymentAmount = options.amount
		this.fileExists = options.fileExists!!
	}
	onupdate(vNode: m.Vnode<Attributes, unknown>): any {
		if(floatingMenuIsOpened("paymentDialog"))
			return
		const options = vNode.attrs
		this.paymentAmount = options.amount
		this.fileExists = options.fileExists!!
	}
	
	view(vNode: m.Vnode<Attributes, unknown>): m.Vnode<any, unknown> {
		const options = vNode.attrs
		return <Btn.TooltipBtn iconKey={options.iconKey} description={Lang.get(options.langKey)} {... floatingMenu("paymentDialog", () => <form class="vertical" onsubmit={this.onSend.bind(this, options)}>
			<label>
				<small>{Lang.get("amount")}</small>
				<input type="number" name="amount" step="0.01" min="0" {...bindValueToInput(this.paymentAmount, (value) => this.paymentAmount = value)}/>
			</label>
			<label>
				<small>{Lang.get("receipt")}</small>
				{this.fileExists
					? <span class="mainContent">
							<Btn.TooltipBtn iconKey="delete" description={Lang.get("deleteRecipe")} onclick={() => {this.fileExists = false}}/>
						</span>
					: <input type="file" name="receipt"/>
				}
			
			</label>
			<div class="horizontal hAlignEnd vAlignCenter">
				<FeedbackIcon callback={this.setPaidFeedback} reserveSpace={true}/>
				<input disabled={!this.setPaidFeedback.isReady()} type="submit" value={Lang.get("save")} />
			</div>
		</form>)}/>
	}
	
}
