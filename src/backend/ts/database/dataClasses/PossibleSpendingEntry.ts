import {User} from "./User";
import {TableSettings} from "../TableSettings";
import {PubPossibleSpendingEntry} from "../../../../shared/public/PubPossibleSpendingEntry";
import {column} from "../column";
import {WaitingEntry} from "./WaitingEntry";
import {BudgetHistory} from "./BudgetHistory";

export class PossibleSpendingEntry extends PubPossibleSpendingEntry {
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
			db.insert(WaitingEntry, { possibleSpendingEntryId: addedId, userId: data.userId })
			BudgetHistory.addHistory(db, data.userId!, "historyAddSpending", [data.spendingName, addedId])
		})
		settings.setOnBeforeDelete((id, db, session) => {
			BudgetHistory.addHistory(db, session.userId!, "historyDeleteSpending", [id])
		})
		
		settings.setListFilter(session => `${column(PossibleSpendingEntry, "userId")} = ${session.userId}`)
		settings.setFloatValues("spendingSum")

		return settings
	}
	
	public userId: number | bigint = 0
}
