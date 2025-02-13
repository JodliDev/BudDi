import {User} from "./User";
import {TableSettings} from "../TableSettings";
import {PubBudget} from "../../../../shared/public/PubBudget";
import {Waiting} from "./Waiting";
import {History} from "./History";
import {SqlWhere} from "../SqlWhere";
import {BackendTableMethods} from "../DatabaseInstructions";

export class Budget extends PubBudget implements BackendTableMethods {
	getSettings(): TableSettings<this> {
		const settings = new TableSettings<this>("budgetId")

		settings.setForeignKey("userId", {
			table: User,
            to: "userId",
			on_delete: "CASCADE"
		})
		
		settings.setOnBeforeAdd((data, db, session) => {
			data.userId = session.userId
		})
		settings.setOnAfterAdd((data, db, addedId) => {
			db.insert(Waiting, {budgetId: addedId, userId: data.userId})
			History.addHistory(db, data.userId!, "historyAddBudget", [data.budgetName], addedId)
		})
		settings.setOnBeforeDelete((id, db, session) => {
			const [budget] = db.selectTable(Budget, {where: SqlWhere(Budget).is("budgetId", id), limit: 1})
			History.addHistory(db, session.userId!, "historyDeleteBudget", [budget.budgetName])
		})
		
		settings.setListFilter(session => SqlWhere(Budget).is("userId", session.userId))
		settings.setFloatValues("spendingSum")
		settings.setAllowedFilterColumn(Budget, "budgetId")
		settings.setAllowedFilterColumn(Budget, "budgetName")

		return settings
	}
	
	public userId: number | bigint = 0
}
