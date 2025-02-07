import {TableSettings} from "../TableSettings";
import {column} from "../column";
import {PubHistory} from "../../../../shared/public/PubHistory";
import {LangKey} from "../../../../shared/Lang";
import {DatabaseManager} from "../DatabaseManager";
import {Budget} from "./Budget";


export class History extends PubHistory {
	getSettings(): TableSettings<this> {
		const settings = new TableSettings<this>()
		
		settings.setDataType("budgetId", "number")
		
		settings.setForeignKey("budgetId", {
			table: Budget,
			to: "budgetId",
			on_delete: "CASCADE",
			isPublic: true
		})
		
		settings.setOnBeforeAdd((data, db, session) => {
			data.userId = session.userId
		})
		
		settings.setListFilter(session => `${column(History, "userId")} = ${session.userId}`)
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
		db.insert(History, { userId: userId, langKey: langKey, langValues: JSON.stringify(values), historyTime: Date.now(), budgetId: budgetId })
	}
}
