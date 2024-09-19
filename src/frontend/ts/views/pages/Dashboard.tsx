import m, { Vnode } from "mithril";
import {ListWidget, ListWidgetCallback} from "../../widgets/ListWidget";
import {Lang} from "../../../../shared/Lang";
import {PubWaitingEntry} from "../../../../shared/public/PubWaitingEntry";
import {PubDonationEntry} from "../../../../shared/public/PubDonationEntry";
import {BtnWidget} from "../../widgets/BtnWidget";
import {PubNeedsDonationEntry} from "../../../../shared/public/PubNeedsDonationEntry";
import {ChooseDonationMessage} from "../../../../shared/messages/ChooseDonationMessage";
import {ListMessage} from "../../../../shared/messages/ListMessage";
import {ListResponseMessage} from "../../../../shared/messages/ListResponseMessage";
import {SetAsPaidMessage} from "../../../../shared/messages/SetAsPaidMessage";
import {DropdownOptions, MouseOverDropdownMenu} from "../../widgets/DropdownMenu";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import "./dashboard.css"
import {PubUser} from "../../../../shared/public/PubUser";
import {LoggedInBasePage} from "../LoggedInBasePage";

interface NeedsDonationEntryInformation {
	donationEntry: PubDonationEntry
	needsDonationEntry: PubNeedsDonationEntry
}

export class Dashboard extends LoggedInBasePage {
	private needsDonationEntries: NeedsDonationEntryInformation[] = []
	private notDonatedListCallback: ListWidgetCallback = new ListWidgetCallback()
	private dropdownOptions: DropdownOptions = {
		manualPositioning: true,
		disableMenuPointerEvents: true
	}
	private user = new PubUser()
	
	
	private positionDonationInfo(event: MouseEvent) {
		this.dropdownOptions.updatePositionCallback && this.dropdownOptions.updatePositionCallback(event.clientX, event.clientY)
	}
	private donationLineView(entry: PubDonationEntry, addedAt?: number): Vnode {
		return <div class="horizontal fillSpace donationEntry">
			{ entry.homepage.length != 0
				? <a href={ entry.homepage } target="_blank">
					{ BtnWidget.DefaultBtn("home") }
				</a>
				: BtnWidget.Empty()
			}
			{ entry.donationUrl.length != 0
				? <a href={ entry.donationUrl } target="_blank">
					{ BtnWidget.DefaultBtn("donate") }
				</a>
				: BtnWidget.Empty()
			}
			{
				<div class="fillSpace">
					{
						this.donationDropdown(
						<span>{ entry.donationName }</span>,
						entry,
						addedAt
					)
					}
				</div>
			}
		</div>
	}
	private donationDropdown(clickElement: Vnode, entry: PubDonationEntry, addedAt?: number): Vnode<any, unknown> {
		return MouseOverDropdownMenu(
			"donationEntry",
			<div onmousemove={this.positionDonationInfo.bind(this)} class="donationDropdownClicker">
				{ clickElement }
			</div>,
			() => <div class="surface vertical donationDropdownContent">
				<h3 class="textCentered">{ entry.donationName }</h3>
				<div class="subSurface labelLike">
					<small>{Lang.get("numberOfDonations")}</small>
					<span>{entry.donationTimes}</span>
				</div>
				<div class="subSurface labelLike">
					<small>{Lang.get("totalDonations")}</small>
					<span>{entry.donationsSum}{this.user.currency}</span>
				</div>
				<div class="subSurface labelLike">
					<small>{Lang.get("lastDonation")}</small>
					<span>{entry.lastDonation ? (new Date(entry.lastDonation)).toLocaleDateString() : Lang.get("notDonatedYet")}</span>
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
	
	private async chooseDonation(): Promise<void> {
		const response = await this.site.socket.sendAndReceive(new ChooseDonationMessage())
		if(!response.success) {
			this.site.errorManager.error(Lang.get("errorUnknown"))
			return
		}
		await this.loadNeededDonations()
		await this.notDonatedListCallback.reload()
	}
	
	private async loadNeededDonations(): Promise<void> {
		const response = await this.site.socket.sendAndReceive(new ListMessage(PubNeedsDonationEntry, 0, 100)) as ListResponseMessage<PubNeedsDonationEntry>
		if(response.success)
			this.needsDonationEntries = response.list.map(entry => {
				return {
					donationEntry: entry.joined["DonationEntry"] as PubDonationEntry,
					needsDonationEntry: entry.item
				}
			})
	}
	
	private async setAsPaid(info: NeedsDonationEntryInformation) {
		const response = await this.site.socket.sendAndReceive(new SetAsPaidMessage(info.needsDonationEntry)) as ConfirmResponseMessage
		if(response.success) {
			await this.loadNeededDonations()
			await this.notDonatedListCallback.reload()
		}
		else
			this.site.errorManager.error(Lang.get("errorUnknown"))
	}
	
	async load(): Promise<void> {
		await super.load()
		await this.loadNeededDonations()
		
		const response = await this.site.socket.sendAndReceive(
			new ListMessage(PubUser, 0, 1)
		) as ListResponseMessage<PubUser>
		
		if(response.success && response.list.length != 0)
			this.user = response.list[0].item
	}
	
	getView(): Vnode {
		return <div class="vertical">
			<div class="horizontal vAlignStretched hAlignCenter wrapContent needsDonationBox">
				{ this.needsDonationEntries.map(info => 
					<div class="vertical surface needsDonationEntry hAlignStretched">
						<div class="subSurface textCentered donationHeader">{info.needsDonationEntry.amount}{this.user?.currency}</div>
						{
							this.donationDropdown(
								<div class="textCentered">{info.donationEntry.donationName}</div>,
								info.donationEntry,
								info.needsDonationEntry.addedAt
							)
						}
						<div class="fillSpace"></div>
						<div class="horizontal subSurface">
							{ info.donationEntry.homepage.length != 0 &&
								<a href={ info.donationEntry.homepage } target="_blank">
									{ BtnWidget.DefaultBtn("home") }
								</a>
							}
							{ info.donationEntry.donationUrl.length != 0 &&
								<a href={ info.donationEntry.donationUrl } target="_blank">
									{ BtnWidget.DefaultBtn("donate") }
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
					<div class="horizontal vAlignCenter chooseDonationBtn">
						{
							BtnWidget.PopoverBtn("luck", Lang.get("selectRandomDonationNow"), this.chooseDonation.bind(this))
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
							this.donationLineView(entry.joined.DonationEntry as PubDonationEntry, entry.item.addedAt)
					})
				}
				
				{
					ListWidget({
						title: Lang.get("allEntries"),
						tableClass: PubDonationEntry,
						site: this.site,
						hideRefresh: true,
						addOptions: {
							columns: ["donationName", "homepage", "donationUrl"],
							onAdded: async () => {
								this.notDonatedListCallback.reload && await this.notDonatedListCallback.reload()
							}
						},
						editOptions: {columns: ["donationName", "homepage", "donationUrl", "enabled"] },
						deleteOptions: {
							onDeleted: async () => {
								await this.notDonatedListCallback.reload()
								await this.loadNeededDonations()
							} 
						},
						getEntryView: entry => this.donationLineView(entry.item)
					})
				}
			</div>
		</div>
	}
}
