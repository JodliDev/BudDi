import m, {Vnode} from "mithril";
import { Site } from "./Site";

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
	public async load(): Promise<void> {
		return this.site.socket.waitUntilReady()
	}
	public abstract getView(): Vnode<any, any>
}
