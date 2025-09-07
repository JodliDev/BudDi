import m from "mithril"
import "./pageNumbers.css"
import {PAGE_SIZE} from "../../Constants"
import {TsClosureComponent} from "../../../mithril-polyfill"
import { Btn } from "./Btn"


export class PageNumberFeedback {
	reload = (page?: number) => console.error("Not defined yet")
}
interface Attributes {
	loadPage: (page: number) => Promise<number>
	feedback?: PageNumberFeedback
}

/**
 * Handles load response and creates a page menu with the appropriate to start, prev, next and / or to end buttons
 */
export default TsClosureComponent<Attributes>((vNode) => {
	let attributes = vNode.attrs
	async function onPageChange(page: number): Promise<void> {
		currentPage = page
		totalCount = await attributes.loadPage(page)
		lastPage = Math.floor(totalCount / PAGE_SIZE)
	}
	function isNeeded() : boolean {
		return lastPage >= 1
	}
	
	let currentPage = 0
	let totalCount = 0
	let lastPage = 0
	
	if(attributes.feedback) {
		attributes.feedback.reload = (page: number = currentPage) => onPageChange(page)
	}
	
	onPageChange(0)
		.then()
	
	return {
		view: vNode => {
			return isNeeded()
				? <div class="PageNumbers horizontal hAlignCenter vAlignCenter">
					{currentPage > 1
						? <Btn.Default iconKey="toStart" onclick={() => onPageChange(0)}/>
						: <Btn.Empty/>
					}
					{currentPage > 0
						? <Btn.Default iconKey="prev" onclick={() => onPageChange(currentPage - 1)}/>
						: <Btn.Empty/>
					}
					
					<span>{currentPage + 1}&nbsp;/&nbsp;{lastPage + 1}</span>
					
					{currentPage < lastPage
						? <Btn.Default iconKey="next" onclick={() => onPageChange(currentPage + 1)}/>
						: <Btn.Empty/>
					}
					{currentPage + 1 < lastPage
						? <Btn.Default iconKey="toEnd" onclick={() => onPageChange(lastPage)}/>
						: <Btn.Empty/>
					}
				</div>
				: ""
		},
		onupdate: vNode => {
			attributes = vNode.attrs
		}
	}
})
