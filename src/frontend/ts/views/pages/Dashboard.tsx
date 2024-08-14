import { BasePage } from "../BasePage";
import m, { Vnode } from "mithril";
import {ListWidget} from "../../widgets/ListWidget";
import {ListDonationEntry} from "../../../../shared/lists/ListDonationEntry";
import {Lang} from "../../../../shared/Lang";

export class Dashboard extends BasePage {
	
	getView(): Vnode {
		return <div>
			{
				ListWidget({
					title: Lang.get("donationEntries"),
					listClass: ListDonationEntry,
					site: this.site,
					addOptions: ["donationName", "homepage", "donationUrl"],
					canDelete: true,
					getEntryView: entry => <span
						class="fillSpace"
					>
						{ entry.donationName }
					</span>
				})
			}
		</div>;
	}
}
