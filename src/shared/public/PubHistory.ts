import {BasePublicTable} from "../BasePublicTable";
import {LangKey} from "../Lang";


export class PubHistory extends BasePublicTable {
	public historyId: number | bigint = 0
	public budgetId: number | bigint | null = null
	public historyTime: number = 0
	public langKey: LangKey = "" as LangKey
	public langValues: string = "[]"
}
