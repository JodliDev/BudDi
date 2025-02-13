import {BasePublicTable} from "../BasePublicTable";
import {LangKey} from "../Lang";

export class PubBudget extends BasePublicTable {
	public static readonly BUDGET_NAME_MIN_LENGTH = 3
	
	getTranslation(key: keyof this): LangKey {
		switch(key) {
			case "budgetName":
				return "name"
			default:
				return key as LangKey
		}
	}
	
	
	public budgetId: number | bigint = 0
	public budgetName: string = ""
	public homepage: string = ""
	public iconDataUrl: string = ""
	
	public enabledForWaitingList: boolean = true
	public spendingSum: number = 0
	public spendingTimes: number = 0
	public lastPayment: number = 0
	public isTaxExempt: boolean = false
}
