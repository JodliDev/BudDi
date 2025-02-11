import m, { Vnode } from "mithril";
import {Lang} from "../../../../shared/Lang";
import {ListWidget, ListWidgetCallback} from "../../widgets/ListWidget";
import {LoggedInBasePage} from "../LoggedInBasePage";
import {PubBudget} from "../../../../shared/public/PubBudget";
import {PubPayment} from "../../../../shared/public/PubPayment";
import {BtnWidget} from "../../widgets/BtnWidget";
import {DownloadReceiptMessage} from "../../../../shared/messages/DownloadReceiptMessage";
import "./payments.css"
import {BindValueToInput} from "../../widgets/BindValueToInput";
import {ListFilter} from "../../../../shared/ListFilter";
import {Site} from "../Site";

export class Payments extends LoggedInBasePage {
	private isTaxExempt: boolean = false;
	private yearsForFilter: number[] = []
	private selectedYear: string = ""
	private paymentsCallback: ListWidgetCallback = new ListWidgetCallback()
	
	constructor(
		site: Site,
		variableString: string,
		public budgetId?: number | bigint
	) {
		super(site, variableString)
	}
	async load(): Promise<void> {
		const payment = await this.site.socket.getSingleEntry(PubPayment, undefined, "paymentTime", "ASC")
		
		if(payment) {
			const last = new Date(payment.paymentTime).getFullYear()
			const now = new Date().getFullYear()
			for(let i = last; i <= now; ++i) {
				this.yearsForFilter.push(i)
			}
		}
	}
	
	private async downloadReceipt(payment: PubPayment): Promise<void> {
		const response = await this.site.socket.sendAndReceiveBinary(new DownloadReceiptMessage(payment.paymentId))
		
		if(response == null)
			return
		const objectUrl: string = URL.createObjectURL(response);
		const a = document.createElement('a') as HTMLAnchorElement;
		
		a.href = objectUrl;
		a.download = payment.receiptFileName;
		document.body.appendChild(a);
		a.click();
		
		document.body.removeChild(a);
		URL.revokeObjectURL(objectUrl);
	}
	
	getView(): Vnode {
		const filter = ListFilter<PubPayment>("and")
		if(this.selectedYear) {
			const year = parseInt(this.selectedYear)
			const first = new Date(year, 0, 1, 0, 0, 0, 0)
			const last = new Date(year, 11, 31, 23, 59, 59, 999)
			filter.addRule("paymentTime", ">=", first.getTime())
			filter.addRule("paymentTime", "<=", last.getTime())
		}
		if(this.isTaxExempt)
			filter.addRule("isTaxExempt", "=", true)
		if(this.budgetId)
			filter.addRule("budgetId", "=", this.budgetId)
		
		return <div class="vertical hAlignCenter">
			{
				ListWidget({
					title: Lang.get("payments"),
					tableClass: PubPayment,
					order: "paymentTime",
					orderType: "DESC",
					site: this.site,
					filter: filter,
					callback: this.paymentsCallback,
					AddSubHeader: () => <form>
						<label>
							<small>{Lang.get("year")}</small>
							<select {...BindValueToInput(
								() => this.selectedYear,
								(value) => {
									this.selectedYear = value
									m.redraw()
								}
							)}>
								<option value="">{Lang.get("all")}</option>
								{
									this.yearsForFilter.map((year) =>
										<option>{year}</option>
									)
								}
							</select>
						</label>
						<label>
							<small>{Lang.get("isTaxExempt")}</small>
							<input type="checkbox" {...BindValueToInput(() => this.isTaxExempt, (value) => this.isTaxExempt = value)} />
						</label>
					</form>,
				AddFirstLineView: () => <tr>
						<th class="name">{Lang.get("budget")}</th>
						<th class="date">{Lang.get("date")}</th>
						<th class="time">{Lang.get("time")}</th>
						<th class="amount">{Lang.get("amount")}</th>
						<th class="recipes"></th>
					</tr>,
					getEntryView: entry => {
						const payment = entry.item
						const budget = entry.joined["Budget"] as PubBudget
						
						return [
							<td class="name overflowHidden">
								<div class="horizontal vAlignCenter">
								{budget?.iconDataUrl
									? <img alt="" src={budget.iconDataUrl} class="icon"/>
									: BtnWidget.Empty()
								}
								{budget.budgetName}
								</div>
							</td>,
							<td class="date">
								{(new Date(payment.paymentTime)).toLocaleDateString(undefined, {
									year: "numeric",
									month: "2-digit",
									day: "2-digit"
								})}
							</td>,
							<td class="time">
								{(new Date(payment.paymentTime)).toLocaleTimeString(undefined, {
									timeStyle: "short"
								})}
							</td>,
							<td class="amount">
								{payment.amount}
								{this.site.getCurrency()}
							</td>,
							<td class="recipes">
								{payment.receiptFileName
									? BtnWidget.PopoverBtn("receipt", Lang.get("downloadReceipt"), this.downloadReceipt.bind(this, payment))
									: BtnWidget.Empty()
								}
							</td>
						]
					}
				})
			}
		</div>
	}
}
