import addSvg from "../../../img/icons/add.svg"
import arrowCircleLeft from "../../../img/icons/arrowCircleLeft.svg"
import cancelSvg from "../../../img/icons/cancel.svg"
import checkCircleSvg from "../../../img/icons/checkCircle.svg"
import donateSvg from "../../../img/icons/donate.svg"
import editSvg from "../../../img/icons/edit.svg"
import homeSvg from "../../../img/icons/home.svg"
import luckSvg from "../../../img/icons/luck.svg"
import menuSvg from "../../../img/icons/menu.svg"
import nextSvg from "../../../img/icons/next.svg"
import prevSvg from "../../../img/icons/prev.svg"
import receiptSvg from "../../../img/icons/receipt.svg"
import reloadSvg from "../../../img/icons/reload.svg"
import toStartSvg from "../../../img/icons/toStart.svg"
import trashSvg from "../../../img/icons/trash.svg"
import toEndSvg from "../../../img/icons/toEnd.svg"
import m from "mithril"
import {TsClosureComponent} from "../../../mithril-polyfill"

export const IconType = {
	add: addSvg,
	arrowCircleLeft: arrowCircleLeft,
	checkCircle: checkCircleSvg,
	delete: trashSvg,
	donate: donateSvg,
	edit: editSvg,
	home: homeSvg,
	menu: menuSvg,
	next: nextSvg,
	prev: prevSvg,
	remove: cancelSvg,
	receipt: receiptSvg,
	luck: luckSvg,
	reload: reloadSvg,
	toStart: toStartSvg,
	toEnd: toEndSvg
}

export interface IconAttributes {
	iconKey: keyof typeof IconType,
}

/**
 * Shows a svg icon.
 */
export default TsClosureComponent<IconAttributes>(() => {
	return {
		view: (vNode) => m.trust(IconType[vNode.attrs.iconKey])
	}
})
