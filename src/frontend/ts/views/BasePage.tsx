import m, {Vnode} from "mithril";
import { Site } from "./Site";
import {LoadingSpinner} from "../widgets/LoadingSpinner";

export interface PageVariables {
	[key: string]: string | undefined
}

export abstract class BasePage {
	private _variables?: PageVariables
	public isLoaded: boolean = false
	public get variables(): PageVariables | undefined {
		return this._variables
	}
	public set variables(value: PageVariables | undefined) {
		this._variables = value
		this.onVariablesChanged(value)
	}
	
	constructor(protected site: Site) {
		try {
			this.load().then(() => {
				this.isLoaded = true
				m.redraw()
			})
		}
		catch(error: unknown) {
			this.site.errorManager.error(error)
		}
	}
	
	protected goTo(url: string) {
		document.location.hash = url;
	}
	
	public onVariablesChanged(variables?: PageVariables): void {
		// needs overload
	}
	
	public getLoadingView(): Vnode<any, unknown> {
		return <div class="vertical hAlignCenter vAlignCenter page fullLine"> { LoadingSpinner() }</div>
	}
	public getFullView(): Vnode<any, unknown> {
		const pageView = this.getView()
		pageView.attrs.className += ` page fullLine ${this.constructor.name}`
		return pageView
	}
	
	public async load(): Promise<void> {
		return this.site.socket.waitUntilReady()
	}
	public abstract getView(): Vnode<any, unknown>
}
