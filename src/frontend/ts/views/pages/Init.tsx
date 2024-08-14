import { BasePage } from "../BasePage";
import m, { Vnode } from "mithril";

export class Init extends BasePage {
	getView(): Vnode<any, any> {
		return <div>
			Loading...
		</div>;
	}
}
