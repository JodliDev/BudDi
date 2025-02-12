import m, {Vnode} from "mithril";
import {BasePage} from "../BasePage";
import headerSvg from "../../../img/header.svg"
import {Lang} from "../../../../shared/Lang";
import "./about.css"

export class About extends BasePage {
	getView(): Vnode {
		return <div class="vertical hAlignCenter">
			<div class="surface">
				<div class="content vertical">
					<div class="textCentered">
						{m.trust(headerSvg)}
					</div>
					
					<div>{Lang.get("appDescription")}</div>
					
					<div class="labelLike">
						<small>{Lang.get("licence")}</small>
						<span class="mainContent">MIT</span>
					</div>
					
					<div class="labelLike">
						<small>{Lang.get("creator")}</small>
						<span class="mainContent">JodliDev</span>
					</div>
					
					<div class="labelLike">
						<small>{Lang.getWithColon("homepage")}</small>
						<span class="mainContent"><a href="https://github.com/JodliDev/BudDi">https://github.com/JodliDev/BudDi</a></span>
					</div>
				</div>
			</div>
		</div>;
	}
}
