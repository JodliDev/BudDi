import {Budget} from "./Budget";
import {User} from "./User";
import {TableSettings} from "../TableSettings";
import {PubWaiting} from "../../../../shared/public/PubWaiting";
import {column} from "../column";
import {ChooseForSpendingMessageAction} from "../../network/messageActions/ChooseForSpendingMessageAction";

export class Waiting extends PubWaiting {
	getSettings(): TableSettings<this> {
		const settings = new TableSettings<this>()
		
		settings.setForeignKey("budgetId", {
			table: Budget,
			to: "budgetId",
			on_delete: "CASCADE",
			isPublic: true
		})
		
		settings.setForeignKey("userId", {
			table: User,
			to: "userId",
			on_delete: "CASCADE"
		})
		
		settings.setOnBeforeAdd((data, db, session) => {
			data.userId = session.userId
		})
		settings.setOnAfterDelete((_, db, session) => {
			ChooseForSpendingMessageAction.refillWaitingEntriesIfNeeded(db, session.userId!)
		})
		
		settings.setListFilter(session => `${column(Waiting, "userId")} = ${session.userId}`)
		
		
		return settings
	}
	
	public userId: number | bigint = 0
	public budgetId: number | bigint = 0
}
