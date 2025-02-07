import {User} from "./User";
import {TableSettings} from "../TableSettings";
import {PubBudget} from "../../../../shared/public/PubBudget";
import {column} from "../column";
import {Waiting} from "./Waiting";
import {History} from "./History";

export class Budget extends PubBudget {
	getSettings(): TableSettings<this> {
		const settings = new TableSettings<this>()

		settings.setForeignKey("userId", {
			table: User,
            to: "userId",
			on_delete: "CASCADE"
		})
		
		settings.setOnBeforeAdd((data, db, session) => {
			data.userId = session.userId
		})
		settings.setOnAfterAdd((data, db, addedId) => {
			db.insert(Waiting, { budgetId: addedId, userId: data.userId })
			History.addHistory(db, data.userId!, "historyAddBudget", [data.budgetName], addedId)
		})
		settings.setOnBeforeDelete((id, db, session) => {
			const [budget] = db.selectTable(Budget, `${column(Budget, "budgetId")} = ${id}`, 1)
			History.addHistory(db, session.userId!, "historyDeleteBudget", [budget.budgetName])
		})
		
		settings.setListFilter(session => `${column(Budget, "userId")} = ${session.userId}`)
		settings.setFloatValues("spendingSum")

		return settings
	}
	
	public userId: number | bigint = 0
}
