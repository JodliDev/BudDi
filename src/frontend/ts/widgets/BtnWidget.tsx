import m, { Vnode } from "mithril"
import addSvg from "../../img/icons/add.svg";
import editSvg from "../../img/icons/edit.svg";
import trashSvg from "../../img/icons/trash.svg";
import reloadSvg from "../../img/icons/reload.svg";
import toStartSvg from "../../img/icons/toStart.svg"
import prevSvg from "../../img/icons/prev.svg"
import nextSvg from "../../img/icons/next.svg"
import toEndSvg from "../../img/icons/toEnd.svg"
import "./BtnWidget.css"

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
	public static Delete(onClick: () => void): Vnode {
		return BtnWidget.DefaultBtn(trashSvg, onClick)
	}
	public static Edit(onClick?: () => void): Vnode {
		return BtnWidget.DefaultBtn(editSvg, onClick)
	}
	public static Reload(onClick: () => void): Vnode {
		return BtnWidget.DefaultBtn(reloadSvg, onClick)
	}
	public static Prev(onClick: () => void): Vnode {
		return BtnWidget.DefaultBtn(prevSvg, onClick)
	}
	public static ToStart(onClick: () => void): Vnode {
		return BtnWidget.DefaultBtn(toStartSvg, onClick)
	}
	public static ToEnd(onClick: () => void): Vnode {
		return BtnWidget.DefaultBtn(toEndSvg, onClick)
	}
	public static Next(onClick: () => void): Vnode {
		return BtnWidget.DefaultBtn(nextSvg, onClick)
	}
}
