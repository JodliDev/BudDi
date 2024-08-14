import m, { Vnode } from "mithril";
import { Lang, LangKey } from "../../../shared/Lang";
import "./header.css"
import { Site } from "./Site";

export class Header {
	
	constructor(private site: Site) {
	}
	
	
	private getLine(currentPage: string, target: LangKey): Vnode {
		return <a class={currentPage == target ? "selected" : ""} href={ `#${target}` }>{Lang.get(target)}</a>
	}
	
	public getView(currentPage: string): Vnode {
		return <div class="header">
			{ this.site.errorManager.getView() }
			<div class="navigation">
				{
					this.site.isLoggedIn()
						? [
							this.getLine(currentPage, "Home"),
						] 
						: [
							this.getLine(currentPage, "Login"),
							this.getLine(currentPage, "Register"),
						]
					
				}
			</div>
			{this.site.isLoggedIn() && 
				<span class="clickable logoutBtn" onclick={this.site.logout.bind(this.site)}>{Lang.get("Logout")}</span>
			}
		</div>
	}
}
