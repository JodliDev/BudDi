import m, { Vnode } from "mithril";
import {Lang} from "../../../../shared/Lang";
import {ListWidget} from "../../widgets/ListWidget";
import {LoggedInBasePage} from "../LoggedInBasePage";
import {PubBudget} from "../../../../shared/public/PubBudget";
import {PubPayment} from "../../../../shared/public/PubPayment";
import {BtnWidget} from "../../widgets/BtnWidget";
import {DownloadReceiptMessage} from "../../../../shared/messages/DownloadReceiptMessage";
import "./payments.css"

export class Payments extends LoggedInBasePage {
	
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
		return <div class="vertical hAlignCenter">
			{
				ListWidget({
					title: Lang.get("payments"),
					tableClass: PubPayment,
					order: "paymentTime",
					orderType: "DESC",
					site: this.site,
					AddHeaderView: () => <tr>
						<th></th>
						<th>{Lang.get("date")}</th>
						<th>{Lang.get("time")}</th>
						<th>{Lang.get("amount")}</th>
						<th></th>
					</tr>,
					getEntryView: entry => {
						const payment = entry.item
						const budget = entry.joined["Budget"] as PubBudget
						
						return [
							<td>{ budget?.iconDataUrl
								? <img alt="" src={budget.iconDataUrl}/>
								: BtnWidget.Empty()
							}</td>,
							<td>
								{(new Date(payment.paymentTime)).toLocaleDateString()}
							</td>,
							<td>
								{(new Date(payment.paymentTime)).toLocaleTimeString()}
							</td>,
							<td>
								{payment.amount}
							</td>,
							<td>
								{payment.receiptFileName
									? BtnWidget.PopoverBtn("receipt", Lang.get("downloadReceipt"), this.downloadReceipt.bind(this, payment))
									: BtnWidget.Empty()
								}
							</td>
						]
					}
				})
			}
		</div>;
	}
}
