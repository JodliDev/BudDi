import {BasePublicTable} from "../BasePublicTable";
import {LangKey} from "../Lang";

export class PubBudget extends BasePublicTable {
	public static readonly SPENDING_NAME_MIN_LENGTH = 3
	
	getTranslation(key: keyof PubBudget): LangKey {
		switch(key) {
			case "spendingName":
				return "name"
			case "enabled":
			case "homepage":
			case "spendingUrl":
				return key
			default:
				return key as LangKey
		}
	}
	getPrimaryKey(): keyof this {
		return "budgetId"
	}
	
	
	public budgetId: number | bigint = 0
	public spendingName: string = ""
	public homepage: string = ""
	public spendingUrl: string = ""
	public iconDataUrl: string = ""
	
	public enabled: boolean = true
	public spendingSum: number = 0
	public spendingTimes: number = 0
	public lastSpending: number = 0
}
