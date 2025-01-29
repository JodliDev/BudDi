import m, {Component, Vnode} from "mithril"
import "./feedbackIcon.css"
import checkCircleFilledSvg from "../../img/icons/checkCircleFilled.svg"
import failSvg from "../../img/icons/fail.svg"

export interface FeedbackCallBack {
	feedback?: (success: boolean) => void
}

interface FeedbackIconOptions extends FeedbackCallBack {
	reserveSpace?: boolean
	callback: FeedbackCallBack
}

class FeedbackIconComponent implements Component<FeedbackIconOptions, unknown> {
	private showIcon: boolean = false
	private success: boolean = false
	private timeoutId: number = 0
	
	oncreate(vNode: Vnode<FeedbackIconOptions, unknown>): void {
		const options = vNode.attrs
		
		options.callback.feedback = (_success: boolean) => {
			this.showIcon = true
			this.success = _success
			m.redraw()
			
			window.clearTimeout(this.timeoutId)
			this.timeoutId = window.setTimeout(() => {
				this.showIcon = false
				m.redraw()
			}, 2000)
			
		}
	}
	
	view(vNode: Vnode<FeedbackIconOptions, unknown>): Vnode {
		const options = vNode.attrs
		
		return this.showIcon
			? <div class={`feedbackIcon ${this.success ? "success" : "failed"}`}>{
				m.trust(this.success ? checkCircleFilledSvg : failSvg)
			}</div>
			: <div class={`feedbackIcon hidden ${options.reserveSpace ? "reserveSpace" : ""}`}></div>
	}
}

export function FeedbackIcon(callback: FeedbackCallBack, reserveSpace: boolean = false): Vnode<FeedbackIconOptions, unknown> {
	return m(FeedbackIconComponent, {
		reserveSpace: reserveSpace,
		callback: callback
	})
}
