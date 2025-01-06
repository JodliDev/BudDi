import m, { Vnode } from "mithril";
import "./errorManager.css"
import { Lang } from "../../../shared/Lang";

interface Entry {
	date: Date
	type: "error" | "warn" | "log"
	message: string
	hiding?: boolean
}

const HIDE_ENTRIES_AFTER_MS = 3000

export class ErrorManager {
	private recentEntries: Entry[] = []
	private entries: Entry[] = []
	private isOpened: boolean = false
	
	private getEntryView(entry: Entry, index: number = 0): Vnode {
		return <div class={ `subSurface ${entry.type} labelLike ${entry.hiding && !this.isOpened ? "hiding" : ""}` } style={`animation-duration: ${ Math.min(300 + index * 25, 1000)}ms`}>
			<small>{ entry.date.toLocaleTimeString() }</small>
			<pre class="messageContent">{ entry.message }</pre>
		</div>
	}
	
	private addEntry(entry: Entry): void {
		
		this.recentEntries.push(entry)
		// this.entries.push(entry)
		m.redraw.sync()
		window.setTimeout(() => {
			entry.hiding = true
			m.redraw()
		},HIDE_ENTRIES_AFTER_MS)
		window.setTimeout(() => {
			this.entries.push(entry)
			this.recentEntries.shift()
			m.redraw()
		}, HIDE_ENTRIES_AFTER_MS + 500)
	}
	
	private onToggleOpen(): void {
		this.isOpened = !this.isOpened
		// m.redraw()
	}
	
	public error(error: unknown): void {
		console.error(error)
		const msg = (error as Error)?.message || (error as Object)?.toString() || error as string || Lang.get("errorUnknown")
		this.addEntry({
			date: new Date(),
			type: "error",
			message: msg,
		})
	}
	public getView(): Vnode {
		if(this.entries.length == 0 && this.recentEntries.length == 0)
			return <div></div>
		
		return <div class="errorBox">
			<div class={`opener clickable ${this.isOpened ? "opened" : ""}`} onclick={ this.onToggleOpen.bind(this) }>{ Lang.get("logs") }</div>
			<div class={`list ${this.isOpened ? "opened" : ""}`}>
				<div class="listContent">
					<div class="vertical reversed">
						{ this.isOpened && this.entries.map((entry, i) => this.getEntryView(entry, this.entries.length - i)) }
						{ this.recentEntries.map((entry) => this.getEntryView(entry)) }
					</div>
				</div>
			</div>
		</div>
	}
}
