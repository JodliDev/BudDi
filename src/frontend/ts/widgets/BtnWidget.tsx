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

export class BtnWidget {
	private static DefaultBtn(iconString: string, onClick: () => void = () => {}) : Vnode {
		return (
			<div class="btn clickable horizontal hAlignCenter" onclick={ onClick }>
				{ m.trust(iconString) }
			</div>
		)
	}
	
	public static Empty() {
		return <div class="btn empty"></div>
	}
	
	public static Add(onClick?: () => void): Vnode {
		return BtnWidget.DefaultBtn(addSvg, onClick)
	}
	public static ArrowCircleLeft(onClick?: () => void): Vnode {
		return BtnWidget.DefaultBtn(arrowCircleLeft, onClick)
	}
	public static CheckCircle(onClick: () => void): Vnode {
		return BtnWidget.DefaultBtn(checkCircleSvg, onClick)
	}
	public static Delete(onClick: () => void): Vnode {
		return BtnWidget.DefaultBtn(trashSvg, onClick)
	}
	public static Donate(onClick?: () => void): Vnode {
		return BtnWidget.DefaultBtn(donateSvg, onClick)
	}
	public static Edit(onClick?: () => void): Vnode {
		return BtnWidget.DefaultBtn(editSvg, onClick)
	}
	public static Home(onClick?: () => void): Vnode {
		return BtnWidget.DefaultBtn(homeSvg, onClick)
	}
	public static Next(onClick: () => void): Vnode {
		return BtnWidget.DefaultBtn(nextSvg, onClick)
	}
	public static Prev(onClick: () => void): Vnode {
		return BtnWidget.DefaultBtn(prevSvg, onClick)
	}
	public static Luck(onClick: () => void): Vnode {
		return BtnWidget.DefaultBtn(luckSvg, onClick)
	}
	public static Reload(onClick: () => void): Vnode {
		return BtnWidget.DefaultBtn(reloadSvg, onClick)
	}
	public static ToStart(onClick: () => void): Vnode {
		return BtnWidget.DefaultBtn(toStartSvg, onClick)
	}
	public static ToEnd(onClick: () => void): Vnode {
		return BtnWidget.DefaultBtn(toEndSvg, onClick)
	}
}
