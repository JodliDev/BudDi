import m, {Vnode} from "mithril";
import {Login} from "./pages/Login";
import {Site} from "./Site";
import {BasePage} from "./BasePage";

export abstract class LoggedInBasePage extends BasePage {
	private loginPage: Login
	
	constructor(site: Site) {
		super(site)
		this.loginPage = new Login(site)
		this.site.waitForLogin.then(() => m.redraw())
	}
	async load(): Promise<void> {
		await super.load()
		await this.site.waitForLogin
	}
	
	public getLoadingView(): Vnode<any, unknown> {
		if(!this.site.isLoggedIn())
			return this.loginPage.getFullView()
		return super.getLoadingView();
	}
}
