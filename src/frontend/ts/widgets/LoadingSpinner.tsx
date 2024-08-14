import m, { Vnode } from "mithril"
import "./loadingSpinner.css"

export function LoadingSpinner(visible: boolean = true, reserveSpace: boolean = false): Vnode {
	return (
		<div class={`loaderAnimation ${visible ? "" : "hidden"} ${reserveSpace ? "reserveSpace" : ""}`}></div>
	)
}
