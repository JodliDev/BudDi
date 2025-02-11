import m, {Vnode} from "mithril";
import {ListWidget, ListWidgetCallback} from "../../widgets/ListWidget";
import {Lang} from "../../../../shared/Lang";
import {PubWaiting} from "../../../../shared/public/PubWaiting";
import {PubBudget} from "../../../../shared/public/PubBudget";
import {BtnWidget} from "../../widgets/BtnWidget";
import {PubNeedsPayment} from "../../../../shared/public/PubNeedsPayment";
import {ChooseForPaymentMessage} from "../../../../shared/messages/ChooseForPaymentMessage";
import {ListMessage} from "../../../../shared/messages/ListMessage";
import {ListResponseMessage} from "../../../../shared/messages/ListResponseMessage";
import {DropdownOptions, MouseOverDropdownMenu} from "../../widgets/DropdownMenu";
import "./dashboard.css"
import {LoggedInBasePage} from "../LoggedInBasePage";
import {AddToWaitingMessage} from "../../../../shared/messages/AddToWaitingMessage";
import {DeleteMessage} from "../../../../shared/messages/DeleteMessage";
import {ImageUpload} from "../../widgets/ImageUpload";
import {Budget} from "./Budget";
import {PaymentEditor} from "../elements/PaymentEditor";
import {AddPaymentMessage} from "../../../../shared/messages/AddPaymentMessage";

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
	
	private getPaymentEditorView(amount: number, budget: PubBudget): Vnode<any, unknown> {
		return PaymentEditor({
			site: this.site,
			iconKey: "donate",
			langKey: "addPayment",
			amount: amount,
			getMessage: (amount, _, file) => new AddPaymentMessage(amount, file, file?.type, file?.name, budget),
			onFinish: async (response, amount) => {
				if(response.success) {
					await this.loadNeedsPayment()
					await this.allEntriesCallback.reload()
					this.site.errorManager.log(Lang.get("historyAddPayment", amount, this.site.getCurrency(), budget.budgetName))
				}
			}
		})
	}
	
	private budgetLineView(budget: PubBudget, addedAt?: number): Vnode {
		return <div class={`horizontal fillSpace budgetEntry overflowHidden ${budget.enabledForWaitingList ? "" : "notEnabledForWaitingList"}`}>
			{budget?.iconDataUrl
				? <img alt="" src={budget.iconDataUrl} class="icon"/>
				: BtnWidget.Empty()
			}
			<div class="fillSpace">
				{
					this.budgetDropdown(
						<div class="horizontal vAlignCenter">
							<a href={`#${Budget.name}/budgetId=${budget.budgetId}`}>
								{budget.budgetName}
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
				{clickElement}
			</div>,
			() => <div class="surface vertical budgetDropdownContent">
				<h3 class="textCentered horizontal vAlignCenter hAlignCenter">
					{entry.iconDataUrl && <img class="icon" src={entry.iconDataUrl} alt=""/>}
					<span class="mainContent">{entry.budgetName}</span>
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
				{!!addedAt &&
					<div class="subSurface labelLike">
						<small>{Lang.get("addedAt")}</small>
						<span class="mainContent">{(new Date(addedAt)).toLocaleDateString()}</span>
					</div>
				}
			</div>,
			this.dropdownOptions
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
									<a href={`#${Budget.name}/budgetId=${info.budget.budgetId}`}>
										{info.budget.budgetName}
									</a>
								</div>,
								info.budget,
								info.needsPayment.addedAt
							)
						}
						<div class="fillSpace"></div>
						<div class="horizontal subSurface">
							{info.budget.homepage.length != 0 &&
								<a href={info.budget.homepage} target="_blank">
									{BtnWidget.PopoverBtn("home", Lang.get("homepage"))}
								</a>
							}
							<div class="fillSpace"></div>
							{
								this.getPaymentEditorView(info.needsPayment.amount, info.budget)
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
						deleteOptions: {onDeleted: () => this.waitingListCallback.reload()},
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
						callback: this.allEntriesCallback,
						getEntryView: entry => [
							BtnWidget.PopoverBtn("arrowCircleLeft", Lang.get("manuallyAddToWaitingList"), this.addToWaitList.bind(this, entry.item)),
							this.budgetLineView(entry.item),
							entry.item.homepage.length != 0
								? <a class="icon" href={entry.item.homepage} target="_blank">
									{BtnWidget.PopoverBtn("home", Lang.get("homepage"))}
								</a>
								: BtnWidget.Empty(),
							this.getPaymentEditorView(1, entry.item)
						]
					})
				}
			</div>
		</div>
	}
}
