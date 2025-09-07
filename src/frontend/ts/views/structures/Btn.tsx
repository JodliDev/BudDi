import m from "mithril"
import "./btn.css"
import {TsClosureComponent} from "../../../mithril-polyfill"
import Icon, {IconAttributes} from "./Icon"
import {tooltip} from "./floatingMenu"

interface BtnAttributes extends IconAttributes{
	onclick?: (e: MouseEvent) => void,
	label?: string,
	class?: string
}

/**
 * A button with an icon and an optional label
 */
const Default = TsClosureComponent<BtnAttributes>(() => {
	return {
		view: (vNode) => <div {...vNode.attrs} class={`Btn ${vNode.attrs.iconKey} ${vNode.attrs.class ?? ""} clickable horizontal hAlignCenter vAlignCenter`} onclick={vNode.attrs.onclick}>
			<Icon iconKey={vNode.attrs.iconKey}/>
			{!!vNode.attrs.label && vNode.attrs.label}
		</div>
	}
})

interface TooltipAttributes extends BtnAttributes{
	description: string
}

/**
 * A default button with a mouseover tooltip
 */
const TooltipBtn = TsClosureComponent<TooltipAttributes>(() => {
	return {
		view: (vNode) =>
			<Default {...vNode.attrs} {...tooltip(vNode.attrs.description)} iconKey={vNode.attrs.iconKey} onclick={vNode.attrs.onclick}/>
	}
})

/**
 * Empty space in the size of a button
 */
const Empty = TsClosureComponent<{}>(() => {
	return {
		view: () => <div class="Btn empty"></div>
	}
})

export const Btn = {Default, TooltipBtn: TooltipBtn, Empty}
