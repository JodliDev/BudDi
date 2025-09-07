import m from "mithril"
import "./loadingSpinner.css"
import {TsClosureComponent} from "../../../mithril-polyfill"

interface Attributes {
	class?: string
}

/**
 * Shows a loading animation.
 */
export default TsClosureComponent<Attributes>((vNode) => {
	return {
		view: () => (
			<div {...vNode.attrs} class={`LoadingSpinner ${vNode.attrs.class ?? ""}`}></div>
		)
	}
})
