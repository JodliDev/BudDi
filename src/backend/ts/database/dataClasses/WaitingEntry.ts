import {PossibleSpendingEntry} from "./PossibleSpendingEntry";
import {User} from "./User";
import {TableSettings} from "../TableSettings";
import {PubWaitingEntry} from "../../../../shared/public/PubWaitingEntry";
import {column} from "../column";
import {ChooseForSpendingMessageAction} from "../../network/messageActions/ChooseForSpendingMessageAction";

export class WaitingEntry extends PubWaitingEntry {
	getSettings(): TableSettings<this> {
		const settings = new TableSettings<this>()
		
		settings.setForeignKey("possibleSpendingEntryId", {
			table: PossibleSpendingEntry,
			to: "possibleSpendingEntryId",
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
		
		settings.setListFilter(session => `${column(WaitingEntry, "userId")} = ${session.userId}`)
		
		
		return settings
	}
	
	public userId: number | bigint = 0
	public possibleSpendingEntryId: number | bigint = 0
}
