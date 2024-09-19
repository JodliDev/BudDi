import m, { Vnode } from "mithril"
import addSvg from "../../img/icons/add.svg";
import arrowCircleLeft from "../../img/icons/arrowCircleLeft.svg";
import checkCircleSvg from "../../img/icons/checkCircle.svg";
import donateSvg from "../../img/icons/donate.svg";
import editSvg from "../../img/icons/edit.svg";
import homeSvg from "../../img/icons/home.svg";
import luckSvg from "../../img/icons/luck.svg"
import nextSvg from "../../img/icons/next.svg"
import prevSvg from "../../img/icons/prev.svg"
import reloadSvg from "../../img/icons/reload.svg";
import toStartSvg from "../../img/icons/toStart.svg"
import trashSvg from "../../img/icons/trash.svg";
import toEndSvg from "../../img/icons/toEnd.svg"
import "./btnWidget.css"
import {DropdownComponentOptions, MouseOverDropdownMenu} from "./DropdownMenu";

export const ButtonType = {
	add: addSvg,
	arrowCircleLeft: arrowCircleLeft,
	checkCircle: checkCircleSvg,
	delete: trashSvg,
	donate: donateSvg,
	edit: editSvg,
	home: homeSvg,
	next: nextSvg,
	prev: prevSvg,
	luck: luckSvg,
	reload: reloadSvg,
	toStart: toStartSvg,
	toEnd: toEndSvg
}

export class BtnWidget {
	public static DefaultBtn(iconKey: keyof typeof ButtonType, onClick: () => void = () => {}) : Vnode {
		return (
			<div class="btn clickable horizontal hAlignCenter" onclick={ onClick }>
				{ m.trust(ButtonType[iconKey]) }
			</div>
		)
	}
	public static PopoverBtn(iconKey: keyof typeof ButtonType, text: string, onClick: () => void = () => {}) : Vnode<DropdownComponentOptions, unknown> {
		return MouseOverDropdownMenu(
			"btnWidget",
			BtnWidget.DefaultBtn(iconKey, onClick),
			() => <div class="textCentered">{ text }</div>,
		)
	}
	
	public static Empty() {
		return <div class="btn empty"></div>
	}
}
