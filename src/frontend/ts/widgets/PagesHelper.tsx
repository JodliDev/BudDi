import m, {Vnode} from "mithril"
import "./pagesHelper.css"
import {BtnWidget} from "./BtnWidget";


export class PagesHelper {
	private totalCount: number = 0
	private currentPage: number = 0
	private lastPage: number = 1
	
	constructor(
		private readonly pageSize: number,
		private readonly pageChangeCallback: (page: number) => Promise<void>
	) { }
	
	private async onPageChange(newPage: number): Promise<void> {
		this.currentPage = newPage
		await this.pageChangeCallback(newPage)
	}
	
	public getCurrentPage(): number {
		return this.currentPage
	}
	public isEmpty() : boolean {
		return this.totalCount == 0
	}
	public isNeeded() : boolean {
		return this.lastPage >= 1
	}
	
	public setTotalCount(totalCount: number): void {
		this.totalCount = totalCount
		this.lastPage = Math.floor(totalCount / this.pageSize)
	}
	
	public load(): Promise<void> {
		return this.onPageChange(this.currentPage)
	}
	
	public reset(): void {
		this.currentPage = 0
		this.totalCount = 0
	}
	
	public getView(): Vnode {
		return <div class="horizontal hAlignCenter vAlignCenter subSurface pagesHelper">
				{this.currentPage > 1
					? BtnWidget.DefaultBtn("toStart", () => this.onPageChange(0))
					: BtnWidget.Empty()
				}
				{this.currentPage > 0
					? BtnWidget.DefaultBtn("prev", () => this.onPageChange(this.currentPage - 1))
					: BtnWidget.Empty()
				}
				
				<span>{this.currentPage + 1}&nbsp;/&nbsp;{this.lastPage + 1}</span>
				
				{this.currentPage < this.lastPage
					? BtnWidget.DefaultBtn("next", () => this.onPageChange(this.currentPage + 1))
					: BtnWidget.Empty()
				}
				{this.currentPage + 1 < this.lastPage
					? BtnWidget.DefaultBtn("toEnd", () => this.onPageChange(this.lastPage))
					: BtnWidget.Empty()
				}
			</div>
		
	}
}
