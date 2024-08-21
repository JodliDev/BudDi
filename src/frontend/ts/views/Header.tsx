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
		return <div class="siteHeader">
			{ this.site.errorManager.getView() }
			<div class="navigation">
				{ this.site.isLoggedIn()
					? [
						this.getLine(currentPage, "Dashboard"),
						this.getLine(currentPage, "Schedule"),
						this.getLine(currentPage, "User"),
					] 
					: [
						this.getLine(currentPage, "Login"),
						this.site.serverSettings.registrationAllowed && this.getLine(currentPage, "Register"),
					]
				}
				{ this.site.isAdmin &&
					this.getLine(currentPage, "Admin")
				}
			</div>
			{ this.site.isLoggedIn() && 
				<span class="clickable logoutBtn" onclick={this.site.logout.bind(this.site)}>{Lang.get("Logout")}</span>
			}
		</div>
	}
}
