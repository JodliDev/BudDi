import {Vnode} from "mithril";
import {Login} from "./pages/Login";
import {Site} from "./Site";
import {BasePage} from "./BasePage";

export abstract class LoggedInBasePage<T extends string = string> extends BasePage<T> {
	private readonly loginPage: Login
	private readonly observerId: number
	
	constructor(site: Site, variablesString: string) {
		super(site, variablesString)
		this.loginPage = new Login(site, variablesString)
		
		this.observerId = this.site.loginState.reactToChange(async (isLoggedIn) => {
			await this.loadPage()
		})
	}
	
	public async loadPage(): Promise<void> {
		if(this.site.loginState.isLoggedIn())
			return super.loadPage()
	}
	
	public unload() {
		super.unload()
		this.site.loginState.removeObserver(this.observerId)
	}
	
	public getLoadingView(): Vnode<any, unknown> {
		if(!this.site.loginState.isLoggedIn())
			return this.loginPage.getFullView()
		return super.getLoadingView()
	}
	
	public getFullView(): Vnode<any, unknown> {
		if(!this.site.loginState.isLoggedIn())
			return this.loginPage.getFullView()
		return super.getFullView()
	}
}
