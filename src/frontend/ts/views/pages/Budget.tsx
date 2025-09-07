import m, {Vnode} from "mithril";
import {LoggedInBasePage} from "../LoggedInBasePage";
import "./budget.css"
import {PubBudget} from "../../../../shared/public/PubBudget";
import {ListFilter} from "../../../../shared/ListFilter";
import FeedbackIcon, {FeedbackCallBack} from "../structures/FeedbackIcon";
import {Payments} from "./Payments";
import {Site} from "../Site";
import {History} from "./History";
import {Lang} from "../../../../shared/Lang";
import EditEntry from "../structures/EditEntry";
import {ImageUpload} from "../structures/ImageUpload";
import DeleteEntry from "../structures/DeleteEntry";
import PaymentEditor from "../structures/PaymentEditor";
import {AddPaymentMessage} from "../../../../shared/messages/AddPaymentMessage";
import { Btn } from "../structures/Btn";
import floatingMenu from "../structures/floatingMenu";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";

export class Budget extends LoggedInBasePage<"budgetId"> {
	private budget: PubBudget | null = null
	private feedback = new FeedbackCallBack()
	private paymentsPage: Payments
	private historyPage: History
	
	
	constructor(site: Site, variableString: string) {
		super(site, variableString)
		this.paymentsPage = new Payments(site, variableString, this.getIntVariable("budgetId"))
		this.historyPage = new History(site, variableString, this.getIntVariable("budgetId"))
	}
	
	async onVariablesChanged(): Promise<void> {
		await this.load()
		this.paymentsPage.budgetId = this.budget?.budgetId
		this.historyPage.budgetId = this.budget?.budgetId
	}
	
	async load(): Promise<void> {
		await this.paymentsPage.isLoadedPromise
		await this.historyPage.isLoadedPromise
		const budgetId = this.getIntVariable("budgetId")
		if(!budgetId || isNaN(budgetId))
			return
		
		this.feedback.setLoading(true)
		this.budget = await this.site.socket.getSingleEntry(PubBudget, ListFilter<PubBudget>().addRule("budgetId", "=", budgetId))
		
		this.feedback.setSuccess(this.budget != null)
		m.redraw()
	}
	
	getView(): Vnode<any, unknown> {
		return this.budget
			? <div class="vertical hAlignCenter">
				<div class="budget vertical">
					<div class="surface vertical">
						<h3 class="horizontal">
							<div class="header textCentered vertical vAlignCenter hAlignCenter">
								<span class="textCentered horizontal vAlignCenter hAlignCenter">
									{this.budget.iconDataUrl && <img class="icon" src={this.budget.iconDataUrl} alt=""/>}
									<span>{this.budget.budgetName}</span>
								</span>
								
								{this.budget.homepage &&
									<small><a class="mainContent" href={this.budget.homepage} target="_blank">{this.budget.homepage}</a></small>
								}
							</div>
							<div class="horizontal vAlignCenter">
								{this.budget && [
									<PaymentEditor
										site={this.site}
										iconKey="donate"
										langKey="addPayment"
										amount={1}
										getMessage={(amount: number, _: boolean, file?: File) =>
											new AddPaymentMessage(amount, file, file?.type, file?.name, this.budget!)}
										onFinish={async (response: ConfirmResponseMessage) => {
											if(response.success)
												await this.load()
										}}
									/>,
									<Btn.TooltipBtn iconKey="edit" description={Lang.get("changeEntry")} {...floatingMenu("ChangeBudget", (close) => 
										<EditEntry<PubBudget>
											mode="edit"
											site={this.site}
											editId={this.budget!.budgetId}
											defaults={this.budget!}
											tableClass={PubBudget}
											columns={["budgetName", "homepage", "iconDataUrl", "isTaxExempt", "enabledForWaitingList"]}
											customInputView={(key: keyof PubBudget, value: any, setValue: (newValue: any) => void) => {
												switch(key) {
													case "iconDataUrl":
														return <ImageUpload defaultValue={value.toString()} maxSize={50} callback={setValue}/>
												}
											}}
											onFinish={async() => {
												close()
												await this.load()
											}}
									/>)}/>,
									<DeleteEntry
										site={this.site}
										entryId={this.budget!.budgetId}
										tableClass={PubBudget}
										onDeleted={() => this.site.goto("Dashboard")}
									/>,
								]}
							</div>
						</h3>
						<div class="info vertical">
							<div class="horizontal hAlignStretched wrapContent">
								<div class="subSurface labelLike">
									<small>{Lang.get("paymentCount")}</small>
									<span class="mainContent">{this.budget.spendingTimes}</span>
								</div>
								<div class="subSurface labelLike">
									<small>{Lang.get("totalSpending")}</small>
									<span class="mainContent">{this.budget.spendingSum}{this.site.getCurrency()}</span>
								</div>
								<div class="subSurface labelLike">
									<small>{Lang.get("lastPayment")}</small>
									<span
										class="mainContent">{this.budget.lastPayment ? (new Date(this.budget.lastPayment)).toLocaleDateString() : Lang.get("nothingYet")}</span>
								</div>
							</div>
							<div class="horizontal hAlignCenter wrapContent">
								<div class="subSurface labelLike">
									<small>{Lang.get("downPayments")}</small>
									<span class="mainContent">{this.budget.downPayment}{this.site.getCurrency()}</span>
								</div>
								<div class="subSurface labelLike">
									<small>{Lang.get("enabledForWaitingList")}</small>
									<span class="mainContent">{Lang.get(this.budget.enabledForWaitingList ? "yes" : "no")}</span>
								</div>
								<div class="subSurface labelLike">
									<small>{Lang.get("isTaxExempt")}</small>
									<span class="mainContent">{Lang.get(this.budget.isTaxExempt ? "yes" : "no")}</span>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div class="lists horizontal wrapContent hAlignCenter">
					<div class="Payments">
						{this.paymentsPage.getView()}
					</div>
					<div class="History">
						{this.historyPage.getView()}
					</div>
				</div>
			</div>
			:
			<FeedbackIcon callback={this.feedback} reserveSpace={true}/>
	}
}
