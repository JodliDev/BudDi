import m, {Vnode} from "mithril";
import ListEntries, {ListCallback} from "../structures/ListEntries";
import {Lang} from "../../../../shared/Lang";
import {PubWaiting} from "../../../../shared/public/PubWaiting";
import {PubBudget} from "../../../../shared/public/PubBudget";
import {PubNeedsPayment} from "../../../../shared/public/PubNeedsPayment";
import {ChooseForPaymentMessage} from "../../../../shared/messages/ChooseForPaymentMessage";
import {ListMessage} from "../../../../shared/messages/ListMessage";
import {ListResponseMessage} from "../../../../shared/messages/ListResponseMessage";
import "./dashboard.css"
import {LoggedInBasePage} from "../LoggedInBasePage";
import {AddToWaitingMessage} from "../../../../shared/messages/AddToWaitingMessage";
import {DeleteMessage} from "../../../../shared/messages/DeleteMessage";
import {ImageUpload} from "../structures/ImageUpload";
import {Budget} from "./Budget";
import PaymentEditor from "../structures/PaymentEditor";
import {AddPaymentMessage} from "../../../../shared/messages/AddPaymentMessage";
import {Btn} from "../structures/Btn";
import floatingMenu from "../structures/floatingMenu";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";

interface NeedsPaymentInformation {
	budget: PubBudget
	needsPayment: PubNeedsPayment
}

export class Dashboard extends LoggedInBasePage {
	private needsPaymentEntries: NeedsPaymentInformation[] = []
	private waitingListCallback: ListCallback = new ListCallback()
	private allEntriesCallback: ListCallback = new ListCallback()
	
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
		return <PaymentEditor
			site={this.site}
			iconKey="donate"
			langKey="addPayment"
			amount={amount}
			getMessage={(amount: number, _: boolean, file?: File) =>
				new AddPaymentMessage(amount, file, file?.type, file?.name, budget)}
			onFinish={async (response: ConfirmResponseMessage) => {
				if(response.success) {
					await this.loadNeedsPayment()
					await this.allEntriesCallback.reload()
					this.site.errorManager.log(Lang.get("historyAddPayment", amount, this.site.getCurrency(), budget.budgetName))
				}
			}}
		/>
	}
	
	private budgetLineView(budget: PubBudget, addedAt?: number): Vnode {
		return <div class={`horizontal fillSpace budgetEntry overflowHidden ${budget.enabledForWaitingList ? "" : "notEnabledForWaitingList"}`}>
			{budget?.iconDataUrl
				? <img alt="" src={budget.iconDataUrl} class="icon"/>
				: <Btn.Empty/>
			}
			<div class="fillSpace">
				<div class="budgetDropdownClicker horizontal vAlignCenter"{...this.budgetDropdown(budget, addedAt)}>
					<a href={`#${Budget.name}/budgetId=${budget.budgetId}`}>
						{budget.budgetName}
					</a>
				</div>
			</div>
		</div>
	}
	private budgetDropdown(entry: PubBudget, addedAt?: number) {
		return floatingMenu("budgetEntry",
			() => 
				<div class="vertical budgetDropdownContent">
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
					{!!entry.downPayment &&
						<div class="subSurface labelLike">
							<small>{Lang.get("downPayments")}</small>
							<span class="mainContent">{entry.downPayment}{this.site.getCurrency()}</span>
						</div>
					}
				</div>,
			{eventName: "mousemove"}
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
						<div
							class="budgetDropdownClicker horizontal fullLine vAlignCenter hAlignCenter"
							{...this.budgetDropdown(info.budget, info.needsPayment.addedAt)}
						>
							{info.budget.iconDataUrl && <img class="icon" src={info.budget.iconDataUrl} alt=""/>}
							<a href={`#${Budget.name}/budgetId=${info.budget.budgetId}`}>
								{info.budget.budgetName}
							</a>
						</div>
						
						<div class="fillSpace"></div>
						<div class="horizontal subSurface">
							{info.budget.homepage.length != 0 &&
								<a href={info.budget.homepage} target="_blank">
									<Btn.TooltipBtn iconKey="home" description={Lang.get("homepage")}/>
								</a>
							}
							<div class="fillSpace"></div>
							{
								this.getPaymentEditorView(info.needsPayment.amount, info.budget)
							}
						</div>
						<Btn.TooltipBtn iconKey="remove" description={Lang.get("removeFromSpendingInfo")} onclick={this.removeFromSpending.bind(this, info.needsPayment)}/>
					</div>
				)}
				{ this.needsPaymentEntries.length > 1 && 
					<div class="needsSpendingTotal vertical surface needsSpendingEntry hAlignStretched">
						<div class="subSurface textCentered spendingHeader">
							{this.needsPaymentEntries.reduce((sum, info) => sum + info.needsPayment.amount, 0)}
							{this.site.getCurrency()}
						</div>
						<div class="subSurface fillSpace horizontal vAlignCenter hAlignCenter">
							{Lang.get("total")}
						</div>
					</div>
				}
			</div>
			<div class="horizontal hAlignCenter wrapContent">
				<ListEntries<PubWaiting>
					title={Lang.get("waitingToBeChosen")}
					tableClass={PubWaiting}
					site={this.site}
					hideRefresh={true}
					order="budgetName"
					deleteOptions={{
						onDeleted: () => this.waitingListCallback.reload()
					}}
					customHeaderOptions={this.waitingListCallback.isEmpty()
						? undefined
						: <Btn.TooltipBtn iconKey="luck" description={Lang.get("selectRandomSpendingNow")} onclick={this.chooseForPayment.bind(this)}/>}
					callback={this.waitingListCallback}
					getEntryView={entry =>
						this.budgetLineView(entry.joined.Budget as PubBudget, entry.item.addedAt)}
				/>
				
				<ListEntries<PubBudget>
					title={Lang.get("allBudgets")}
					tableClass={PubBudget}
					site={this.site}
					hideRefresh={true}
					order="budgetName"
					addOptions={{
						columns: ["budgetName", "homepage", "iconDataUrl", "enabledForWaitingList", "isTaxExempt"],
						onAdded: async () => {
							this.waitingListCallback.reload && await this.waitingListCallback.reload()
						},
						customInputView: (key, value, setValue) => {
							switch(key) {
								case "iconDataUrl":
									return <ImageUpload defaultValue={value.toString()} maxSize={50} callback={setValue}/>
							}
						},
						getValueError: (key, value) => {
							switch(key) {
								case "budgetName":
									return (value as string).length < PubBudget.BUDGET_NAME_MIN_LENGTH ? Lang.get("errorTooShort") : undefined
							}
						}
					}}
					callback={this.allEntriesCallback}
					getEntryView={entry =>[
						<Btn.TooltipBtn iconKey="arrowCircleLeft" description={Lang.get("manuallyAddToWaitingList")} onclick={this.addToWaitList.bind(this, entry.item)}/>,
						this.budgetLineView(entry.item),
						entry.item.homepage.length != 0
							? <a class="icon" href={entry.item.homepage} target="_blank">
								<Btn.TooltipBtn iconKey="home" description={Lang.get("homepage")}/>
							</a>
							: <Btn.Empty/>,
						this.getPaymentEditorView(1, entry.item)
					]}
				/>
			</div>
		</div>
	}
}
