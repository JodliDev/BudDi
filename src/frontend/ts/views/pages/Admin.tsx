import { BasePage } from "../BasePage";
import m, { Vnode } from "mithril";
import {Lang} from "../../../../shared/Lang";
import {PubUser} from "../../../../shared/public/PubUser";
import {ListWidget} from "../../widgets/ListWidget";

export class Admin extends BasePage {
	
	async load(): Promise<void> {
		await super.load();
		await this.site.waitForLogin
		
		// this.site.socket.sendAndReceive(new IsAdminMessage())
	}
	
	getView(): Vnode {
		return <div class="vertical hAlignCenter">
			{
				ListWidget({
					title: Lang.get("User"),
					tableClass: PubUser,
					site: this.site,
					deleteOptions: {},
					getEntryView: entry => <div class="fillSpace">
						{entry.item.username}
					</div>
				})
			}
		</div>;
	}
}
