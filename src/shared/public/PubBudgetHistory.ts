import {BasePublicTable} from "../BasePublicTable";
import {LangKey} from "../Lang";


export class PubBudgetHistory extends BasePublicTable {
	getPrimaryKey(): keyof this {
		return "historyId"
	}
	
	public historyId: number | bigint = 0
	public historyTime: number = 0
	public langKey: LangKey = "" as LangKey
	public langValues: string = "[]"
}
