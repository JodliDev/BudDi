import {PossibleSpendingEntry} from "./PossibleSpendingEntry";
import {User} from "./User";
import {TableSettings} from "../TableSettings";
import {PubNeedsSpendingEntry} from "../../../../shared/public/PubNeedsSpendingEntry";
import {column} from "../column";

export class NeedsSpendingEntry extends PubNeedsSpendingEntry {
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
		
		settings.setListFilter(session => `${column(NeedsSpendingEntry, "userId")} = ${session.userId}`)
		settings.setFloatValues("amount")
		
		settings.setOnBeforeAdd((data, db, session) => {
			data.userId = session.userId
		})
		
		return settings
	}
	
	public userId: number | bigint = 0
	public possibleSpendingEntryId: number | bigint = 0
}
