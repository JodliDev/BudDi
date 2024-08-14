import { BasePage } from "../BasePage";
import m, { Vnode } from "mithril";

export class Home extends BasePage {
	getView(): Vnode {
		return <div>
			<a href="#Login">Login</a>
		</div>;
	}
}
