import m, { Vnode } from "mithril";
import {ListWidget, ListWidgetCallback} from "../../widgets/ListWidget";
import {Lang} from "../../../../shared/Lang";
import {PubWaitingEntry} from "../../../../shared/public/PubWaitingEntry";
import {PubPossibleSpendingEntry} from "../../../../shared/public/PubPossibleSpendingEntry";
import {BtnWidget} from "../../widgets/BtnWidget";
import {PubNeedsSpendingEntry} from "../../../../shared/public/PubNeedsSpendingEntry";
import {ChooseForSpendingMessage} from "../../../../shared/messages/ChooseForSpendingMessage";
import {ListMessage} from "../../../../shared/messages/ListMessage";
import {ListResponseMessage} from "../../../../shared/messages/ListResponseMessage";
import {SetAsPaidMessage} from "../../../../shared/messages/SetAsPaidMessage";
import {DropdownOptions, MouseOverDropdownMenu} from "../../widgets/DropdownMenu";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import "./dashboard.css"
import {PubUser} from "../../../../shared/public/PubUser";
import {LoggedInBasePage} from "../LoggedInBasePage";

interface NeedsSpendingEntryInformation {
	possibleSpendingEntry: PubPossibleSpendingEntry
	needsSpendingEntry: PubNeedsSpendingEntry
}

export class Dashboard extends LoggedInBasePage {
	private needsSpendingEntries: NeedsSpendingEntryInformation[] = []
	private notDonatedListCallback: ListWidgetCallback = new ListWidgetCallback()
	private dropdownOptions: DropdownOptions = {
		manualPositioning: true,
		disableMenuPointerEvents: true
	}
	private user = new PubUser()
	
	
	private positionPossibleSpendingInfo(event: MouseEvent) {
		this.dropdownOptions.updatePositionCallback && this.dropdownOptions.updatePositionCallback(event.clientX, event.clientY)
	}
	private possibleSpendingLineView(entry: PubPossibleSpendingEntry, addedAt?: number): Vnode {
		return <div class="horizontal fillSpace possibleSpendingEntry">
			{ entry.homepage.length != 0
				? <a href={ entry.homepage } target="_blank">
					{ BtnWidget.PopoverBtn("home", Lang.get("homepage")) }
				</a>
				: BtnWidget.Empty()
			}
			{ entry.spendingUrl.length != 0
				? <a href={ entry.spendingUrl } target="_blank">
					{ BtnWidget.PopoverBtn("donate", Lang.get("spendingUrl")) }
				</a>
				: BtnWidget.Empty()
			}
			{
				<div class="fillSpace">
					{
						this.possibleSpendingDropdown(
						<span>{ entry.spendingName }</span>,
						entry,
						addedAt
					)
					}
				</div>
			}
		</div>
	}
	private possibleSpendingDropdown(clickElement: Vnode, entry: PubPossibleSpendingEntry, addedAt?: number): Vnode<any, unknown> {
		return MouseOverDropdownMenu(
			"possibleSpendingEntry",
			<div onmousemove={this.positionPossibleSpendingInfo.bind(this)} class="possibleSpendingDropdownClicker">
				{ clickElement }
			</div>,
			() => <div class="surface vertical possibleSpendingDropdownContent">
				<h3 class="textCentered">{ entry.spendingName }</h3>
				<div class="subSurface labelLike">
					<small>{Lang.get("spendingCount")}</small>
					<span>{entry.spendingTimes}</span>
				</div>
				<div class="subSurface labelLike">
					<small>{Lang.get("totalSpending")}</small>
					<span>{entry.spendingSum}{this.user.currency}</span>
				</div>
				<div class="subSurface labelLike">
					<small>{Lang.get("lastSpending")}</small>
					<span>{entry.lastSpending ? (new Date(entry.lastSpending)).toLocaleDateString() : Lang.get("notDonatedYet")}</span>
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
	
	private async chooseForSpending(): Promise<void> {
		const response = await this.site.socket.sendAndReceive(new ChooseForSpendingMessage())
		if(!response.success) {
			this.site.errorManager.error(Lang.get("errorUnknown"))
			return
		}
		await this.loadNeededSpending()
		await this.notDonatedListCallback.reload()
	}
	
	private async loadNeededSpending(): Promise<void> {
		const response = await this.site.socket.sendAndReceive(new ListMessage(PubNeedsSpendingEntry, 0, 100)) as ListResponseMessage<PubNeedsSpendingEntry>
		if(response.success)
			this.needsSpendingEntries = response.list.map(entry => {
				return {
					possibleSpendingEntry: entry.joined["PossibleSpendingEntry"] as PubPossibleSpendingEntry,
					needsSpendingEntry: entry.item
				}
			})
	}
	
	private async setAsPaid(info: NeedsSpendingEntryInformation) {
		const response = await this.site.socket.sendAndReceive(new SetAsPaidMessage(info.needsSpendingEntry)) as ConfirmResponseMessage
		if(response.success) {
			await this.loadNeededSpending()
			await this.notDonatedListCallback.reload()
		}
		else
			this.site.errorManager.error(Lang.get("errorUnknown"))
	}
	
	async load(): Promise<void> {
		await super.load()
		await this.loadNeededSpending()
		
		const response = await this.site.socket.sendAndReceive(
			new ListMessage(PubUser, 0, 1)
		) as ListResponseMessage<PubUser>
		
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
								<div class="textCentered">{info.possibleSpendingEntry.spendingName}</div>,
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
							{ info.possibleSpendingEntry.spendingUrl.length != 0 &&
								<a href={ info.possibleSpendingEntry.spendingUrl } target="_blank">
									{ BtnWidget.PopoverBtn("donate", Lang.get("spendingUrl")) }
								</a>
							}
							<div class="fillSpace"></div>
							{
								BtnWidget.PopoverBtn("checkCircle", Lang.get("setAsPaid"), this.setAsPaid.bind(this, info))
							}
						</div>
					</div>
				)}
				{ !this.notDonatedListCallback.isEmpty() &&
					<div class="horizontal vAlignCenter chooseSpendingBtn">
						{
							BtnWidget.PopoverBtn("luck", Lang.get("selectRandomSpendingNow"), this.chooseForSpending.bind(this))
						}
					</div>
				}
			</div>
			<div class="horizontal hAlignCenter wrapContent">
				{
					ListWidget({
						title: Lang.get("notDonatedYet"),
						tableClass: PubWaitingEntry,
						site: this.site,
						hideRefresh: true,
						deleteOptions: {},
						callback: this.notDonatedListCallback,
						getEntryView: entry =>
							this.possibleSpendingLineView(entry.joined.PossibleSpendingEntry as PubPossibleSpendingEntry, entry.item.addedAt)
					})
				}
				
				{
					ListWidget({
						title: Lang.get("allEntries"),
						tableClass: PubPossibleSpendingEntry,
						site: this.site,
						hideRefresh: true,
						addOptions: {
							columns: ["spendingName", "homepage", "spendingUrl"],
							onAdded: async () => {
								this.notDonatedListCallback.reload && await this.notDonatedListCallback.reload()
							}
						},
						editOptions: {columns: ["spendingName", "homepage", "spendingUrl", "enabled"] },
						deleteOptions: {
							onDeleted: async () => {
								await this.notDonatedListCallback.reload()
								await this.loadNeededSpending()
							} 
						},
						getEntryView: entry => this.possibleSpendingLineView(entry.item)
					})
				}
			</div>
		</div>
	}
}
