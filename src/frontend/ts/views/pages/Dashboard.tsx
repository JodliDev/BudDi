import { BasePage } from "../BasePage";
import m, { Vnode } from "mithril";
import {ListWidget} from "../../widgets/ListWidget";
import {Lang} from "../../../../shared/Lang";
import {ListWaitingEntry} from "../../../../shared/lists/ListWaitingEntry";
import {ListDonationEntry} from "../../../../shared/lists/ListDonationEntry";

export class Dashboard extends BasePage {
	
	getView(): Vnode {
		return <div>
			{
				ListWidget({
					title: Lang.get("donationEntries"),
					listClass: ListDonationEntry,
					site: this.site,
					addOptions: ["donationName", "homepage", "donationUrl"],
					editOptions: ["donationName", "homepage", "donationUrl", "enabled"],
					canDelete: true,
					getEntryView: entry => <span
						class="fillSpace"
					>
						{ entry.entry.donationName }
					</span>
				})
			}
			{
				ListWidget({
					title: Lang.get("donationEntries"),
					listClass: ListWaitingEntry,
					site: this.site,
					canDelete: true,
					getEntryView: entry => <span
						class="fillSpace"
					>
						{ entry.entry.addedAt }
					</span>
				})
			}
		</div>;
	}
}
