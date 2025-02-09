import {BasePublicTable} from "../BasePublicTable";
import {LangKey} from "../Lang";

export class PubBudget extends BasePublicTable {
	public static readonly BUDGET_NAME_MIN_LENGTH = 3
	
	getTranslation(key: keyof PubBudget): LangKey {
		switch(key) {
			case "budgetName":
				return "name"
			case "enabledForWaitingList":
			case "homepage":
			case "paymentUrl":
				return key
			default:
				return key as LangKey
		}
	}
	getPrimaryKey(): keyof this {
		return "budgetId"
	}
	
	
	public budgetId: number | bigint = 0
	public budgetName: string = ""
	public homepage: string = ""
	public paymentUrl: string = ""
	public iconDataUrl: string = ""
	
	public enabledForWaitingList: boolean = true
	public spendingSum: number = 0
	public spendingTimes: number = 0
	public lastPayment: number = 0
	public isTaxExempt: boolean = false
}
