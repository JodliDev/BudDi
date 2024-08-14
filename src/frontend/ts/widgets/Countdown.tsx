import m, { Vnode } from "mithril";

function toTimeString(until: number) {
	const seconds = Math.floor((until - Date.now()) / 1000)
	
	let output = (seconds % 60).toString()
	if(seconds >= 60) {
		const minutes = Math.floor(seconds / 60)
		output = `${(minutes % 60).toString()}:${output}`
		if(minutes >= 60) {
			const hours = Math.floor(minutes / 60)
			output = `${(hours % 24).toString()}:${output}`
			if(hours >= 24) {
				const days = Math.floor(hours / 24)
				output = `${days}, ${output}`
			}
				
		}
	}
	return output
}

let timoutId: number = 0

function onTimeout() {
	timoutId = 0
	m.redraw()
}

export function Countdown(until: number): Vnode {
	const now = Date.now()
	if(now < until && !timoutId)
		timoutId = setTimeout(() => onTimeout(), 1000, null)
	
	return <div class="countdown">{ toTimeString(until) }</div>
}
