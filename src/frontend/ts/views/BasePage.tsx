import m, {Vnode} from "mithril";
import "./basePage.css"
import {Site} from "./Site";
import {LoadingSpinner} from "../widgets/LoadingSpinner";

export interface PageVariables {
	[key: string]: string
}

export abstract class BasePage<T extends string = string> {
	private readonly variables: PageVariables = {}
	public isLoaded: boolean = false
	public readonly isLoadedPromise: Promise<void>
	
	constructor(protected site: Site, variablesString: string) {
		this.setVariables(variablesString, false)
		
		// loadPage() calls load() which which might use variables from the constructor in some pages.
		// So we have to defer this call to make sure the Page constructor was finished first
		this.isLoadedPromise = new Promise(resolve => {
			window.setTimeout(() => {
				this.loadPage().then(() => {
					resolve()
				})
			})
		})
	}
	
	public setVariables(variablesString?: string, fireChangeEvent: boolean = true): void {
		if(!variablesString) {
			if(fireChangeEvent)
				this.onVariablesChanged()
			return
		}
		
		for(const entry of variablesString.split(";")) {
			const pair = entry.split("=")
			this.variables[pair[0]] = pair.length > 1 ? pair[1] : "1"
		}
		
		if(fireChangeEvent)
			this.onVariablesChanged()
	}
	
	protected onVariablesChanged(): void {
		// needs overload
	}
	protected getVariable(key: T): string | undefined {
		return this.variables[key.toString()]
	}
	protected getIntVariable(key: T): number | undefined {
		return parseInt(this.getVariable(key) ?? "")
	}
	
	public getLoadingView(): Vnode<any, unknown> {
		return <div class="vertical hAlignCenter vAlignCenter page fullLine isLoading"> {LoadingSpinner()}</div>
	}
	public getFullView(): Vnode<any, unknown> {
		const pageView = this.getView()
		pageView.attrs.className += ` page fullLine ${this.constructor.name} isLoaded`
		return pageView
	}
	
	protected async loadPage(): Promise<void> {
		try {
			await this.load()
			this.isLoaded = true
			m.redraw()
		}
		catch(error: unknown) {
			this.site.errorManager.error(error)
		}
	}
	
	protected async load(): Promise<void> {
		return this.site.socket.waitUntilReady()
	}
	public unload(): void {
		// needs overload
	}
	public abstract getView(): Vnode<any, unknown>
}
