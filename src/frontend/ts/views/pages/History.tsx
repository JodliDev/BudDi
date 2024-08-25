import m, { Vnode } from "mithril";
import {Lang} from "../../../../shared/Lang";
import {PubUser} from "../../../../shared/public/PubUser";
import {ListWidget} from "../../widgets/ListWidget";
import {BindValueToInput} from "../../widgets/BindValueToInput";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {SetServerSettingsMessage} from "../../../../shared/messages/SetServerSettingsMessage";
import {FeedbackCallBack, FeedbackIcon} from "../../widgets/FeedbackIcon";
import {LoggedInBasePage} from "../LoggedInBasePage";
import {PubDonationHistory} from "../../../../shared/public/PubDonationHistory";

export class History extends LoggedInBasePage {
	getView(): Vnode {
		return <div class="vertical hAlignCenter">
			{
				ListWidget({
					title: Lang.get("history"),
					tableClass: PubDonationHistory,
					order: "historyTime",
					orderType: "DESC",
					site: this.site,
					getEntryView: entry => <div class="labelLike fillSpace">
						<small>
							{ (new Date(entry.item.historyTime)).toLocaleDateString() }
							&nbsp;
							{ (new Date(entry.item.historyTime)).toLocaleTimeString() }
							
						</small>
						<span>{ Lang.get.call(Lang, entry.item.langKey, ... JSON.parse(entry.item.langValues)) }</span>
					</div>
				})
			}
		</div>;
	}
}
