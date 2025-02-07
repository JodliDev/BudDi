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
import {DropdownOptions, MouseOverDropdownMenu} from "../../widgets/DropdownMenu";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import "./dashboard.css"
import {PubUser} from "../../../../shared/public/PubUser";
import {LoggedInBasePage} from "../LoggedInBasePage";
import {AddToWaitingMessage} from "../../../../shared/messages/AddToWaitingMessage";
import {DeleteMessage} from "../../../../shared/messages/DeleteMessage";
import {ImageUpload} from "../../widgets/ImageUpload";

interface NeedsSpendingEntryInformation {
	possibleSpendingEntry: PubBudget
	needsSpendingEntry: PubNeedsPayment
}

export class Dashboard extends LoggedInBasePage {
	private needsSpendingEntries: NeedsSpendingEntryInformation[] = []
	private waitingListCallback: ListWidgetCallback = new ListWidgetCallback()
	private allEntriesCallback: ListWidgetCallback = new ListWidgetCallback()
	private dropdownOptions: DropdownOptions = {
		manualPositioning: true,
		disableMenuPointerEvents: true
	}
	private user = new PubUser()
	
	
	private positionPossibleSpendingInfo(event: MouseEvent) {
		this.dropdownOptions.updatePositionCallback && this.dropdownOptions.updatePositionCallback(event.clientX, event.clientY)
	}
	private possibleSpendingLineView(entry: PubBudget, addedAt?: number): Vnode {
		return <div class="horizontal fillSpace possibleSpendingEntry overflowHidden">
			{ addedAt === undefined &&
				BtnWidget.PopoverBtn("arrowCircleLeft", Lang.get("manuallyAddToWaitingList"), this.addToWaitList.bind(this, entry)) }
			
			{ entry.homepage.length != 0
				? <a href={ entry.homepage } target="_blank">
					{ BtnWidget.PopoverBtn("home", Lang.get("homepage")) }
				</a>
				: BtnWidget.Empty()
			}
			{ entry.paymentUrl.length != 0
				? <a href={ entry.paymentUrl } target="_blank">
					{ BtnWidget.PopoverBtn("donate", Lang.get("paymentUrl")) }
				</a>
				: BtnWidget.Empty()
			}
			<div class="fillSpace">
				{
					this.possibleSpendingDropdown(
						<div class="horizontal vAlignCenter">
							{ entry.iconDataUrl && <img class="icon" src={ entry.iconDataUrl } alt=""/> }
							{ entry.budgetName }
						</div>,
						entry,
						addedAt
					)
				}
			</div>
		</div>
	}
	private possibleSpendingDropdown(clickElement: Vnode, entry: PubBudget, addedAt?: number): Vnode<any, unknown> {
		return MouseOverDropdownMenu(
			"possibleSpendingEntry",
			<div onmousemove={this.positionPossibleSpendingInfo.bind(this)} class="possibleSpendingDropdownClicker">
				{ clickElement }
			</div>,
			() => <div class="surface vertical possibleSpendingDropdownContent">
				<h3 class="textCentered horizontal vAlignCenter hAlignCenter">
					{ entry.iconDataUrl && <img class="icon" src={ entry.iconDataUrl } alt=""/> }
					<span>{ entry.budgetName }</span>
				</h3>
				<div class="subSurface labelLike">
					<small>{Lang.get("spendingCount")}</small>
					<span>{entry.spendingTimes}</span>
				</div>
				<div class="subSurface labelLike">
					<small>{Lang.get("totalSpending")}</small>
					<span>{entry.spendingSum}{this.user.currency}</span>
				</div>
				<div class="subSurface labelLike">
					<small>{Lang.get("lastPayment")}</small>
					<span>{entry.lastPayment ? (new Date(entry.lastPayment)).toLocaleDateString() : Lang.get("nothingYet")}</span>
				</div>
				{ !!addedAt &&
					<div class="subSurface labelLike">
						<small>{Lang.get("addedAt")}</small>
						<span>{(new Date(addedAt)).toLocaleDateString()}</span>
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
		
		await this.loadNeededSpending()
		await this.waitingListCallback.reload()
	}
	
	private async removeFromSpending(entry: PubNeedsPayment): Promise<void> {
		if(!confirm(Lang.get("confirmDelete")))
			return
		await this.site.socket.sendAndReceive(new DeleteMessage(PubNeedsPayment, entry.needsPaymentId))
		
		await this.loadNeededSpending()
	}
	
	private async loadNeededSpending(): Promise<void> {
		const response = await this.site.socket.sendAndReceive(new ListMessage(PubNeedsPayment, 0, 100)) as ListResponseMessage<PubNeedsPayment>
		if(response.success)
			this.needsSpendingEntries = response.list.map(entry => {
				return {
					possibleSpendingEntry: entry.joined["Budget"] as PubBudget,
					needsSpendingEntry: entry.item
				}
			})
	}
	
	private async setAsPaid(info: NeedsSpendingEntryInformation) {
		const response = await this.site.socket.sendAndReceive(new SetAsPaidMessage(info.needsSpendingEntry)) as ConfirmResponseMessage
		if(response.success) {
			await this.loadNeededSpending()
			await this.allEntriesCallback.reload()
		}
	}
	
	async load(): Promise<void> {
		await super.load()
		await this.loadNeededSpending()
		
		const response = await this.site.socket.sendAndReceive(new ListMessage(PubUser, 0, 1)) as ListResponseMessage<PubUser>
		
		if(response.success && response.list.length != 0)
			this.user = response.list[0].item
	}
	
	getView(): Vnode {
		return <div class="vertical">
			<div class="horizontal vAlignStretched hAlignCenter wrapContent needsSpendingBox">
				{ this.needsSpendingEntries.map(info => 
					<div class="vertical surface needsSpendingEntry hAlignStretched">
						<div class="subSurface textCentered spendingHeader">{info.needsSpendingEntry.amount}{this.user?.currency}</div>
						{
							this.possibleSpendingDropdown(
								<div class="horizontal fullLine vAlignCenter hAlignCenter">
									{ info.possibleSpendingEntry.iconDataUrl && <img class="icon" src={ info.possibleSpendingEntry.iconDataUrl } alt=""/> }
									{ info.possibleSpendingEntry.budgetName }
								</div>,
								info.possibleSpendingEntry,
								info.needsSpendingEntry.addedAt
							)
						}
						<div class="fillSpace"></div>
						<div class="horizontal subSurface">
							{ info.possibleSpendingEntry.homepage.length != 0 &&
								<a href={ info.possibleSpendingEntry.homepage } target="_blank">
									{ BtnWidget.PopoverBtn("home", Lang.get("homepage")) }
								</a>
							}
							{ info.possibleSpendingEntry.paymentUrl.length != 0 &&
								<a href={ info.possibleSpendingEntry.paymentUrl } target="_blank">
									{ BtnWidget.PopoverBtn("donate", Lang.get("paymentUrl")) }
								</a>
							}
							<div class="fillSpace"></div>
							{
								BtnWidget.PopoverBtn("checkCircle", Lang.get("setAsPaid"), this.setAsPaid.bind(this, info))
							}
						</div>
						{ BtnWidget.PopoverBtn("remove", Lang.get("removeFromSpendingInfo"), this.removeFromSpending.bind(this, info.needsSpendingEntry) ) }
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
						order: "budgetName" as keyof PubWaiting,
						deleteOptions: { onDeleted: () => this.waitingListCallback.reload() },
						customOptions: this.waitingListCallback.isEmpty() ? undefined :
							BtnWidget.PopoverBtn("luck", Lang.get("selectRandomSpendingNow"), this.chooseForPayment.bind(this)),
						callback: this.waitingListCallback,
						getEntryView: entry =>
							this.possibleSpendingLineView(entry.joined.Budget as PubBudget, entry.item.addedAt)
					})
				}
				
				{
					ListWidget<PubBudget>({
						title: Lang.get("allEntries"),
						tableClass: PubBudget,
						site: this.site,
						hideRefresh: true,
						order: "budgetName",
						addOptions: {
							columns: ["budgetName", "homepage", "paymentUrl", "iconDataUrl", "isTaxExempt"],
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
										return (value as string).length < PubBudget.SPENDING_NAME_MIN_LENGTH ? Lang.get("errorTooShort") : undefined
								}
							}
						},
						editOptions: {
							columns: ["budgetName", "homepage", "paymentUrl", "iconDataUrl", "enabled"],
							onChanged: async () => {
								await this.waitingListCallback.reload()
								await this.loadNeededSpending()
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
								await this.loadNeededSpending()
							}
						},
						callback: this.allEntriesCallback,
						getEntryView: entry => this.possibleSpendingLineView(entry.item)
					})
				}
			</div>
		</div>
	}
}
