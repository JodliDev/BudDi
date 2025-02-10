import m, { Vnode } from "mithril";
import {Lang} from "../../../../shared/Lang";
import {ListWidget} from "../../widgets/ListWidget";
import {LoggedInBasePage} from "../LoggedInBasePage";
import {PubHistory} from "../../../../shared/public/PubHistory";
import "./history.css"
import {PubBudget} from "../../../../shared/public/PubBudget";

export class History extends LoggedInBasePage {
	getView(): Vnode {
		return <div class="vertical hAlignCenter">
			{
				ListWidget({
					title: Lang.get("history"),
					tableClass: PubHistory,
					order: "historyTime",
					orderType: "DESC",
					site: this.site,
					getEntryView: entry => {
						const budget = entry.joined["Budget"] as PubBudget
						return <div class="historyLine labelLike fillSpace">
							<small>
								{(new Date(entry.item.historyTime)).toLocaleDateString()}
								&nbsp;
								{(new Date(entry.item.historyTime)).toLocaleTimeString()}
							</small>
							<div class="mainContent horizontal">
								{budget?.iconDataUrl
									? <img alt="" src={budget.iconDataUrl} class="icon"/>
									: <div class="icon"></div>
								}
								{Lang.get(entry.item.langKey, ...JSON.parse(entry.item.langValues))}
							</div>
						</div>
					}
				})
			}
		</div>;
	}
}
