import m, {Vnode} from "mithril";
import {Lang, LangKey} from "../../../shared/Lang";
import "./header.css"
import {Site} from "./Site";
import logoSvg from "../../img/logo.svg"
import {DropdownMenu, MouseOverDropdownMenu} from "../widgets/DropdownMenu";
import {BtnWidget} from "../widgets/BtnWidget";

export class Header {
	constructor(private site: Site) { }
	
	
	private getLine(currentPage: string, target: string, title: LangKey): Vnode {
		return <a class={currentPage == target ? "selected" : ""} href={`#${target}`}>{Lang.get(title)}</a>
	}
	
	private getNavigation(currentPage: string): Vnode {
		return <div class="navigation">
			{this.site.loginState.isLoggedIn()
				? [
					this.getLine(currentPage, "Dashboard", "dashboard"),
					this.getLine(currentPage, "Payments", "payments"),
					this.getLine(currentPage, "History", "history"),
					this.getLine(currentPage, "Schedule", "schedule"),
					this.getLine(currentPage, "User", "user"),
				]
				: [
					this.getLine(currentPage, "Login", "login"),
					this.site.serverSettings.registrationAllowed && this.getLine(currentPage, "Register", "register"),
				]
			}
			{this.site.loginState.isAdmin() &&
				this.getLine(currentPage, "Admin", "admin")
			}
		</div>
	}
	
	public getView(currentPage: string): Vnode {
		return <div class="siteHeader horizontal vAlignEnd">
			
			<div class="icon">
				{MouseOverDropdownMenu("appName", <div>{m.trust(logoSvg)}</div>, () =>
					<div>{`${Lang.get("appName")} - ${Lang.get("appTitle")}`}</div>)}
			</div>
			<div class="menuButton">
				{DropdownMenu(
					"dropdownNavigation",
					BtnWidget.DefaultBtn("menu"),
					this.getNavigation.bind(this, currentPage)
				)}
			</div>
			
			{this.getNavigation(currentPage)}
			
			<div class="fillSpace"></div>
			<div class="secondaryNavigation horizontal hAlignCenter">
				{this.site.errorManager.getView()}
				{this.site.loginState.isLoggedIn() && 
					<span class="clickable logoutBtn" onclick={this.site.logout.bind(this.site)}>{Lang.get("logout")}</span>
				}
			</div>
		</div>
	}
}
