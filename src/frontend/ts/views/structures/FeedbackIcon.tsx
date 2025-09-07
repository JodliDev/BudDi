import m from "mithril"
import "./feedbackIcon.css"
import {TsClosureComponent} from "../../../mithril-polyfill"
import LoadingSpinner from "./LoadingSpinner"
import checkCircleFilledSvg from "../../../img/icons/checkCircleFilled.svg"
import failSvg from "../../../img/icons/fail.svg"

/**
 * The callback class for FeedbackIcon. Used to control the visible state and redraw the UI when needed.
 */
export class FeedbackCallBack {
	private isLoadingState: boolean = false
	private showIconState: boolean = false
	private successState: boolean = false
	private timeoutId: NodeJS.Timeout | number = 0
	
	setSuccess(success: boolean) {
		this.showIconState = true
		this.successState = success
		this.isLoadingState = false
		m.redraw()
		
		window.clearTimeout(this.timeoutId)
		this.timeoutId = window.setTimeout(() => {
			this.showIconState = false
			m.redraw()
		}, STATE_REMOVAL_DELAY)
	}
	setLoading(isLoading: boolean) {
		this.isLoadingState = isLoading
		m.redraw()
	}
	isReady() {
		return !this.isLoadingState && (!this.showIconState || this.successState)
	}
}

interface InternatFeedbackCallBack {
	isLoadingState: boolean
	showIconState: boolean
	successState: boolean
}

interface FeedbackIconOptions {
	reserveSpace?: boolean
	callback: FeedbackCallBack
	class?: string
}

const STATE_REMOVAL_DELAY = 2000

/**
 * An icon with an external callback to easily visualize loading states (loading, success, failed).
 * Success and failed states will only be shown for {@link STATE_REMOVAL_DELAY} ms
 */
export default TsClosureComponent<FeedbackIconOptions>(vNode => {
	return {
		view: () => {
			const feedback = vNode.attrs.callback as unknown as InternatFeedbackCallBack
			
			return feedback.isLoadingState
				? <LoadingSpinner {...vNode.attrs}/>
				: (feedback.showIconState
					? <div {...vNode.attrs} class={`FeedbackIcon ${feedback.successState ? "success" : "failed"} ${vNode.attrs.class ?? ""}`}>{
						m.trust(feedback.successState ? checkCircleFilledSvg : failSvg)
					}</div>
					: <div {...vNode.attrs} class={`FeedbackIcon "hidden" ${vNode.attrs.reserveSpace ? "reserveSpace" : ""} ${vNode.attrs.class ?? ""}`}></div>)
		}
	}
})
