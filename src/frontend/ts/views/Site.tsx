import m, {Vnode} from "mithril";
import { FrontendWebSocketHelper } from "../network/FrontendWebSocketHelper";
import { Login } from "./pages/Login";
import "../../style.css"
import { BasePage, PageVariables } from "./BasePage";
import { ErrorManager } from "./ErrorManager";
import { Header } from "./Header";
import "./site.css"
import {deleteCookie, setCookie} from "../Convenience";
import {Lang, LangKey} from "../../../shared/Lang";
import {LoadingSpinner} from "../widgets/LoadingSpinner";
import {LogoutMessage} from "../../../shared/messages/LogoutMessage";
import {UserSettings} from "../../../shared/UserSettings";

export class Site {
	private readonly view: HTMLElement
	private currentPage: BasePage
	
	public readonly socket: FrontendWebSocketHelper
	public readonly errorManager: ErrorManager = new ErrorManager()
	public readonly header: Header = new Header(this)
	public userSettings?: UserSettings
	private isLoggedInState: boolean = false
	public readonly waitForLogin: Promise<void>
	private confirmFullLogin: () => void = () => {}
	
	constructor() {
		this.view = document.getElementById("site")!
		this.waitForLogin = new Promise<void>((resolve) => {
			this.confirmFullLogin = resolve
		})
		this.socket = new FrontendWebSocketHelper(this)
		this.socket.connect()
		
		window.onhashchange = async (e) => {
			await this.gotoImpl(this.getHashName())
		}
		this.currentPage = new Login(this)
		this.renderSite()
		
		if(this.getHashName() != Login.name)
			this.gotoImpl(this.getHashName())
	}
	
	private getHashName(): string {
		return window.location.hash.substring(1) || Login.name
	}
	
	public isLoggedIn(): boolean {
		return this.isLoggedInState;
	}
	
	private async gotoImpl(pageName: string): Promise<void> {
		const [page, variablesString] = pageName.split("/")
		
		try {
			await this.socket.waitUntilReady()
			if(this.currentPage.constructor.name != page)
				this.currentPage = await this.importPage(page)
			
			if(variablesString) {
				const variables: PageVariables = {}
				
				for(const entry of variablesString.split(";")) {
					const pair = entry.split("=")
					variables[pair[0]] = pair.length > 1 ? pair[1] : "1"
				}
				this.currentPage.variables = variables
			}
			else if(this.currentPage.variables)
				this.currentPage.variables = undefined
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
			return new Login(this)
		}
	}
	
	public setUserSettings(userSettings: UserSettings) {
		this.userSettings = userSettings
		this.confirmFullLogin()
		m.redraw()
	}
	
	public login(userId: number | bigint, sessionHash: string) {
		setCookie("userId", userId.toString())
		setCookie("sessionHash", sessionHash)
		//we are not calling confirmFullLogin() yet because we are still waiting for userSettings
		this.isLoggedInState = true
		m.redraw()
	}
	
	public logout() {
		deleteCookie("sessionHash")
		this.socket.send(new LogoutMessage())
		this.isLoggedInState = false
		m.redraw()
		this.goto("Login")
		// document.location.reload()
	}
	
	public refresh(): void {
		this.gotoImpl(this.getHashName())
			.then()
	}
	
	public goto(pageName: LangKey): void {
		window.location.hash = `#${pageName}`
	}
	
	/**
	 * Sets up the view structure and mounts it to the DOM.
	 */
	private renderSite() {
		const site = {
			view: () => {
				let pageView: Vnode<any, any>
				if(this.currentPage.isLoaded) {
					pageView = this.currentPage.getView()
					pageView.attrs.className += ` page fullLine ${this.currentPage.constructor.name}`
				}
				else
					pageView = <div class="vertical hAlignCenter vAlignCenter page fullLine"> { LoadingSpinner() }</div>
				
				return <div class="siteContent">
					{ this.header.getView(this.currentPage.constructor.name) }
					{ pageView }
				</div>
			}
		}
		m.mount(this.view, site)
	}
}
