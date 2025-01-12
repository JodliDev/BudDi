import m, {Vnode} from "mithril";
import "./basePage.css"
import { Site } from "./Site";
import {LoadingSpinner} from "../widgets/LoadingSpinner";

export interface PageVariables {
	[key: string]: string | undefined
}

export abstract class BasePage {
	private variables?: PageVariables
	public isLoaded: boolean = false
	
	constructor(protected site: Site, variablesString: string) {
		this.setVariables(variablesString)
		
		this.loadPage()
	}
	
	public setVariables(variablesString?: string) {
		if(!variablesString) {
			this.variables = undefined
			this.onVariablesChanged(undefined)
			return
		}
		
		const variables: PageVariables = {}
		
		for(const entry of variablesString.split(";")) {
			const pair = entry.split("=")
			variables[pair[0]] = pair.length > 1 ? pair[1] : "1"
		}
		this.variables = variables
		
		this.onVariablesChanged(variables)
	}
	
	protected goTo(url: string) {
		document.location.hash = url;
	}
	
	public onVariablesChanged(variables?: PageVariables): void {
		// needs overload
	}
	
	public getLoadingView(): Vnode<any, unknown> {
		return <div class="vertical hAlignCenter vAlignCenter page fullLine isLoading"> { LoadingSpinner() }</div>
	}
	public getFullView(): Vnode<any, unknown> {
		const pageView = this.getView()
		pageView.attrs.className += ` page fullLine ${this.constructor.name} isLoaded`
		return pageView
	}
	
	public async loadPage(): Promise<void> {
		try {
			await this.load()
			this.isLoaded = true
			m.redraw()
		}
		catch(error: unknown) {
			this.site.errorManager.error(error)
		}
	}
	
	public async load(): Promise<void> {
		return this.site.socket.waitUntilReady()
	}
	public unload(): void {
		// needs overload
	}
	public abstract getView(): Vnode<any, unknown>
}
