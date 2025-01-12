import m, {ComponentTypes} from "mithril";
import { FrontendWebSocketHelper } from "../network/FrontendWebSocketHelper";
import "../../style.css"
import { BasePage } from "./BasePage";
import { ErrorManager } from "./ErrorManager";
import { Header } from "./Header";
import "./site.css"
import {Lang} from "../../../shared/Lang";
import {LogoutMessage} from "../../../shared/messages/LogoutMessage";
import {ServerSettings} from "../../../shared/ServerSettings";
import {IPublicOptions} from "../../../shared/IPublicOptions";
import {Dashboard} from "./pages/Dashboard";
import {LoginState} from "../LoginState";

export class Site {
	private readonly view: HTMLElement
	private currentPage: BasePage
	
	public readonly socket: FrontendWebSocketHelper
	public readonly errorManager: ErrorManager = new ErrorManager()
	public readonly header: Header = new Header(this)
	public serverSettings: ServerSettings = new ServerSettings()
	public readonly loginState: LoginState = new LoginState()
	
	constructor(options: IPublicOptions) {
		this.view = document.getElementById("site")!
		
		this.loginState.reactToChange(() => m.redraw())
		this.socket = new FrontendWebSocketHelper(this, options)
		this.socket.connect()
		
		window.onhashchange = async () => {
			await this.gotoImpl(this.getHashName())
		}
		this.currentPage = new Dashboard(this, "")
		this.renderSite()
		
		if(this.getHashName() != Dashboard.name)
			this.gotoImpl(this.getHashName())
				.then()
	}
	
	private getHashName(): string {
		return window.location.hash.substring(1) || Dashboard.name
	}
	
	private async gotoImpl(pageName: string): Promise<void> {
		const [page, variablesString] = pageName.split("/")
		
		try {
			this.currentPage.unload()
			
			await this.socket.waitUntilReady()
			if(this.currentPage.constructor.name != page)
				this.currentPage = await this.importPage(page)
			else if(variablesString)
				this.currentPage.setVariables(variablesString)
			else
				this.currentPage.setVariables(undefined)
		}
		catch(error: unknown) {
			this.errorManager.error(error)
		}
		m.redraw()
	}
	
	private async importPage(pageName: string): Promise<BasePage> {
		try {
			const loader = await import(`./pages/${pageName}`)
			if(!loader || !loader.hasOwnProperty(pageName))
				throw Lang.get("errorPageDoesNotExist", pageName)
			
			return new loader[pageName](this) as BasePage
		}
		catch(error: unknown) {
			this.errorManager.error(error)
			return new Dashboard(this, "")
		}
	}
	
	public login(userId: number | bigint, sessionHash: string) {
		this.loginState.login(userId, sessionHash)
	}
	
	public logout() {
		this.loginState.logout()
		this.socket.send(new LogoutMessage())
	}
	
	public refresh(): void {
		this.gotoImpl(this.getHashName())
			.then()
	}
	
	public goto(pageName: string): void {
		window.location.hash = `#${pageName}`
	}
	
	/**
	 * Sets up the view structure and mounts it to the DOM.
	 */
	private renderSite() {
		const site: ComponentTypes = {
			view: () => {
				return <div class="siteContent">
					{ this.header.getView(this.currentPage.constructor.name) }
					{ this.currentPage.isLoaded
						? this.currentPage.getFullView()
						: this.currentPage.getLoadingView() }
				</div>
			}
		}
		m.mount(this.view, site)
	}
}
