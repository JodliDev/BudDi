import {TableSettings} from "../TableSettings";
import {PubHistory} from "../../../../shared/public/PubHistory";
import {LangKey} from "../../../../shared/Lang";
import {DatabaseManager} from "../DatabaseManager";
import {Budget} from "./Budget";
import {User} from "./User";
import {SqlWhere} from "../SqlWhere";


export class History extends PubHistory {
	getSettings(): TableSettings<this> {
		const settings = new TableSettings<this>()
		
		settings.setDataType("budgetId", "number")
		
		settings.setForeignKey("userId", {
			table: User,
			to: "userId",
			on_delete: "CASCADE"
		})
		
		settings.setForeignKey("budgetId", {
			table: Budget,
			to: "budgetId",
			on_delete: "SET NULL",
			isPublic: true
		})
		
		settings.setOnBeforeAdd((data, db, session) => {
			data.userId = session.userId
		})
		
		settings.setListFilter(session => SqlWhere(History).is("userId", session.userId))
		settings.setAllowedFilterColumn(History, "budgetId")
		settings.setAllowedFilterColumn(History, "historyTime")
		return settings
	}
	
	public userId: number | bigint = 0
	
	public static addHistory(
		db: DatabaseManager,
		userId: number | bigint,
		langKey: LangKey,
		values: unknown[],
		budgetId: number | bigint | null = null
	) {
		db.insert(History, {userId: userId, langKey: langKey, langValues: JSON.stringify(values), historyTime: Date.now(), budgetId: budgetId})
	}
}
