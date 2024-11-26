import m, { Vnode } from "mithril";
import {Lang} from "../../../../shared/Lang";
import {ListWidget} from "../../widgets/ListWidget";
import {LoggedInBasePage} from "../LoggedInBasePage";
import {PubBudgetHistory} from "../../../../shared/public/PubBudgetHistory";
import "./history.css"

export class History extends LoggedInBasePage {
	getView(): Vnode {
		return <div class="vertical hAlignCenter">
			{
				ListWidget({
					title: Lang.get("history"),
					tableClass: PubBudgetHistory,
					order: "historyTime",
					orderType: "DESC",
					site: this.site,
					getEntryView: entry => <div class="labelLike fillSpace">
						<small>
							{ (new Date(entry.item.historyTime)).toLocaleDateString() }
							&nbsp;
							{ (new Date(entry.item.historyTime)).toLocaleTimeString() }
							
						</small>
						<span>{ Lang.get(entry.item.langKey, ... JSON.parse(entry.item.langValues)) }</span>
					</div>
				})
			}
		</div>;
	}
}
