import { BasePage } from "../BasePage";
import m, { Vnode } from "mithril";
import {ListWidget} from "../../widgets/ListWidget";
import {ListDonationEntry} from "../../../../shared/lists/ListDonationEntry";

export class Dashboard extends BasePage {
	
	getView(): Vnode {
		return <div>
			{
				ListWidget({
					listClass: ListDonationEntry,
					site: this.site,
					addOptions: ["donationName", "homepage", "donationUrl"],
					canDelete: true,
					getEntryView: entry => <a
						class="fillSpace"
						href={ `` }
					>
						{ entry.donationName }
					</a>
				})
			}
		</div>;
	}
}
