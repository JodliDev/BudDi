import m, { Vnode } from "mithril";
import {ListWidget, ListWidgetCallback} from "../../widgets/ListWidget";
import {Lang} from "../../../../shared/Lang";
import {PubWaiting} from "../../../../shared/public/PubWaiting";
import {PubBudget} from "../../../../shared/public/PubBudget";
import {BtnWidget} from "../../widgets/BtnWidget";
import {PubNeedsPayment} from "../../../../shared/public/PubNeedsPayment";
import {ChooseForPaymentMessage} from "../../../../shared/messages/ChooseForPaymentMessage";
import {ListMessage} from "../../../../shared/messages/ListMessage";
import {ListResponseMessage} from "../../../../shared/messages/ListResponseMessage";
import {SetAsPaidMessage} from "../../../../shared/messages/SetAsPaidMessage";
import {closeDropdown, DropdownComponentOptions, DropdownMenu, DropdownOptions, MouseOverDropdownMenu} from "../../widgets/DropdownMenu";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import "./dashboard.css"
import {LoggedInBasePage} from "../LoggedInBasePage";
import {AddToWaitingMessage} from "../../../../shared/messages/AddToWaitingMessage";
import {DeleteMessage} from "../../../../shared/messages/DeleteMessage";
import {ImageUpload} from "../../widgets/ImageUpload";
import {BindValueToInput} from "../../widgets/BindValueToInput";
import {FeedbackCallBack, FeedbackIcon} from "../../widgets/FeedbackIcon";
import {PubPayment} from "../../../../shared/public/PubPayment";
import {Budget} from "./Budget";

interface NeedsPaymentInformation {
	budget: PubBudget
	needsPayment: PubNeedsPayment
}

export class Dashboard extends LoggedInBasePage {
	private needsPaymentEntries: NeedsPaymentInformation[] = []
	private waitingListCallback: ListWidgetCallback = new ListWidgetCallback()
	private allEntriesCallback: ListWidgetCallback = new ListWidgetCallback()
	private dropdownOptions: DropdownOptions = {
		manualPositioning: true,
		disableMenuPointerEvents: true
	}
	
	private paymentAmount: number = 0
	private setPaidFeedback = new FeedbackCallBack()
	
	
	private budgetLineView(budget: PubBudget, addedAt?: number): Vnode {
		return <div class={`horizontal fillSpace budgetEntry overflowHidden ${budget.enabledForWaitingList ? "" : "notEnabledForWaitingList"}`}>
			{ addedAt === undefined &&
				BtnWidget.PopoverBtn("arrowCircleLeft", Lang.get("manuallyAddToWaitingList"), this.addToWaitList.bind(this, budget)) }
			{ addedAt === undefined &&
				this.paymentDropdown(1, budget, undefined)
			}
			{ budget.homepage.length != 0
				? <a href={ budget.homepage } target="_blank">
					{ BtnWidget.PopoverBtn("home", Lang.get("homepage")) }
				</a>
				: BtnWidget.Empty()
			}
			<div class="fillSpace">
				{
					this.budgetDropdown(
						<div class="horizontal vAlignCenter">
							{ budget.iconDataUrl && <img class="icon" src={ budget.iconDataUrl } alt=""/> }
							<a href={`#${Budget.name}/budgetId=${budget.budgetId}`}>
								{ budget.budgetName }
							</a>
						</div>,
						budget,
						addedAt
					)
				}
			</div>
		</div>
	}
	private positionBudgetDropdown(event: MouseEvent) {
		this.dropdownOptions.updatePositionCallback && this.dropdownOptions.updatePositionCallback(event.clientX, event.clientY)
	}
	private budgetDropdown(clickElement: Vnode, entry: PubBudget, addedAt?: number): Vnode<any, unknown> {
		return MouseOverDropdownMenu(
			"budgetEntry",
			<div onmousemove={this.positionBudgetDropdown.bind(this)} class="budgetDropdownClicker">
				{ clickElement }
			</div>,
			() => <div class="surface vertical budgetDropdownContent">
				<h3 class="textCentered horizontal vAlignCenter hAlignCenter">
					{ entry.iconDataUrl && <img class="icon" src={ entry.iconDataUrl } alt=""/> }
					<span class="mainContent">{ entry.budgetName }</span>
				</h3>
				<div class="subSurface labelLike">
					<small>{Lang.get("paymentCount")}</small>
					<span class="mainContent">{entry.spendingTimes}</span>
				</div>
				<div class="subSurface labelLike">
					<small>{Lang.get("totalSpending")}</small>
					<span class="mainContent">{entry.spendingSum}{this.site.getCurrency()}</span>
				</div>
				<div class="subSurface labelLike">
					<small>{Lang.get("lastPayment")}</small>
					<span class="mainContent">{entry.lastPayment ? (new Date(entry.lastPayment)).toLocaleDateString() : Lang.get("nothingYet")}</span>
				</div>
				{ !!addedAt &&
					<div class="subSurface labelLike">
						<small>{Lang.get("addedAt")}</small>
						<span class="mainContent">{(new Date(addedAt)).toLocaleDateString()}</span>
					</div>
				}
			</div>,
			this.dropdownOptions
		)
	}
	
	private async addToWaitList(entry: PubBudget): Promise<void> {
		const response = await this.site.socket.sendAndReceive(new AddToWaitingMessage(entry))
		if(response.success)
			await this.waitingListCallback.reload()
	}
	
	private async chooseForPayment(): Promise<void> {
		const amount = prompt(Lang.get("promptSpendingAmount"), "1")
		if(!amount || Number.isNaN(amount))
			return
		const response = await this.site.socket.sendAndReceive(new ChooseForPaymentMessage(parseFloat(amount)))
		if(!response.success)
			return
		
		await this.loadNeedsPayment()
		await this.waitingListCallback.reload()
	}
	
	private async removeFromSpending(entry: PubNeedsPayment): Promise<void> {
		if(!confirm(Lang.get("confirmDelete")))
			return
		await this.site.socket.sendAndReceive(new DeleteMessage(PubNeedsPayment, entry.needsPaymentId))
		
		await this.loadNeedsPayment()
	}
	
	private async loadNeedsPayment(): Promise<void> {
		const response = await this.site.socket.sendAndReceive(new ListMessage(PubNeedsPayment, 0, 100)) as ListResponseMessage<PubNeedsPayment>
		if(response.success)
			this.needsPaymentEntries = response.list.map(entry => {
				return {
					budget: entry.joined["Budget"] as PubBudget,
					needsPayment: entry.item
				}
			})
	}
	
	private async setAsPaid(budget: PubBudget, needsPayment: PubNeedsPayment | undefined, event: SubmitEvent) {
		event.preventDefault()
		const target = event.target as HTMLFormElement
		const elements = target.elements
		const amount = elements.namedItem("amount") as HTMLInputElement
		const receipt = elements.namedItem("receipt") as HTMLInputElement
		const file = receipt.files ? receipt.files[0] as File : undefined
		
		if(file && file.size > PubPayment.RECEIPT_MAX_SIZE) {
			this.site.errorManager.error(Lang.get("errorFileTooBig", PubPayment.RECEIPT_MAX_SIZE / 1e+6))
			return
		}
		
		const paidMessage = new SetAsPaidMessage(file, file?.type, file?.name, parseInt(amount.value) ?? 1, budget, needsPayment)
		const response = await this.site.socket.sendAndReceive(paidMessage) as ConfirmResponseMessage
		if(response.success) {
			await this.loadNeedsPayment()
			await this.allEntriesCallback.reload()
			closeDropdown("setPaidDialog")
		}
	}
	
	private paymentDropdown(amount: number, budget: PubBudget, needsPayment: PubNeedsPayment | undefined): Vnode<DropdownComponentOptions, unknown> {
		return DropdownMenu(
			"setPaidDialog",
			BtnWidget.PopoverBtn("donate", Lang.get("addPayment"), () => {
				this.paymentAmount = amount
			}),
			() => <form class="vertical" onsubmit={this.setAsPaid.bind(this, budget, needsPayment)}>
				<label>
					<small>{Lang.get("amount")}</small>
					<input type="number" name="amount" min="0" {...BindValueToInput(() => this.paymentAmount, (value) => this.paymentAmount = value)}/>
				</label>
				<label>
					<small>{Lang.get("receipt")}</small>
					<input type="file" name="receipt" />
				</label>
				<div class="horizontal hAlignEnd vAlignCenter">
					{FeedbackIcon(this.setPaidFeedback, true)}
					<input disabled={!this.setPaidFeedback.isReady()} type="submit" value={Lang.get("save")} />
				</div>
			</form>
		)
	}
	
	async load(): Promise<void> {
		await super.load()
		await this.loadNeedsPayment()
	}
	
	getView(): Vnode {
		return <div class="vertical">
			<div class="horizontal vAlignStretched hAlignCenter wrapContent needsSpendingBox">
				{this.needsPaymentEntries.map(info =>
					<div class="vertical surface needsSpendingEntry hAlignStretched">
						<div class="subSurface textCentered spendingHeader">{info.needsPayment.amount}{this.site.getCurrency()}</div>
						{
							this.budgetDropdown(
								<div class="horizontal fullLine vAlignCenter hAlignCenter">
									{info.budget.iconDataUrl && <img class="icon" src={info.budget.iconDataUrl} alt=""/>}
									{info.budget.budgetName}
								</div>,
								info.budget,
								info.needsPayment.addedAt
							)
						}
						<div class="fillSpace"></div>
						<div class="horizontal subSurface">
							{ info.budget.homepage.length != 0 &&
								<a href={ info.budget.homepage } target="_blank">
									{ BtnWidget.PopoverBtn("home", Lang.get("homepage")) }
								</a>
							}
							<div class="fillSpace"></div>
							{
								this.paymentDropdown(info.needsPayment.amount, info.budget, info.needsPayment)
							}
						</div>
						{BtnWidget.PopoverBtn("remove", Lang.get("removeFromSpendingInfo"), this.removeFromSpending.bind(this, info.needsPayment))}
					</div>
				)}
			</div>
			<div class="horizontal hAlignCenter wrapContent">
				{
					ListWidget({
						title: Lang.get("waitingToBeChosen"),
						tableClass: PubWaiting,
						site: this.site,
						hideRefresh: true,
						order: "budgetName",
						deleteOptions: { onDeleted: () => this.waitingListCallback.reload() },
						customHeaderOptions: this.waitingListCallback.isEmpty() ? undefined :
							BtnWidget.PopoverBtn("luck", Lang.get("selectRandomSpendingNow"), this.chooseForPayment.bind(this)),
						callback: this.waitingListCallback,
						getEntryView: entry =>
							this.budgetLineView(entry.joined.Budget as PubBudget, entry.item.addedAt)
					})
				}
				
				{
					ListWidget<PubBudget>({
						title: Lang.get("allBudgets"),
						tableClass: PubBudget,
						site: this.site,
						hideRefresh: true,
						order: "budgetName",
						addOptions: {
							columns: ["budgetName", "homepage", "iconDataUrl", "enabledForWaitingList", "isTaxExempt"],
							onAdded: async () => {
								this.waitingListCallback.reload && await this.waitingListCallback.reload()
							},
							customInputView: (key, value, setValue) => {
								switch(key) {
									case "iconDataUrl":
										return ImageUpload(value.toString(), 50, setValue)
								}
							},
							getValueError: (key, value) => {
								switch(key) {
									case "budgetName":
										return (value as string).length < PubBudget.BUDGET_NAME_MIN_LENGTH ? Lang.get("errorTooShort") : undefined
								}
							}
						},
						editOptions: {
							columns: ["budgetName", "homepage", "iconDataUrl", "isTaxExempt", "enabledForWaitingList"],
							onChanged: async () => {
								await this.waitingListCallback.reload()
								await this.loadNeedsPayment()
							},
							customInputView: (key, value, setValue) => {
								switch(key) {
									case "iconDataUrl":
										return ImageUpload(value.toString(), 50, setValue)
								}
							}
						},
						deleteOptions: {
							onDeleted: async() => {
								await this.waitingListCallback.reload()
								await this.loadNeedsPayment()
							}
						},
						callback: this.allEntriesCallback,
						getEntryView: entry => this.budgetLineView(entry.item)
					})
				}
			</div>
		</div>
	}
}
