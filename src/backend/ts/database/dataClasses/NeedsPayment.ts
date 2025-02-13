import {Budget} from "./Budget";
import {User} from "./User";
import {TableSettings} from "../TableSettings";
import {PubNeedsPayment} from "../../../../shared/public/PubNeedsPayment";
import {SqlWhere} from "../SqlWhere";
import {BackendTableMethods} from "../DatabaseInstructions";

export class NeedsPayment extends PubNeedsPayment implements BackendTableMethods {
	getSettings(): TableSettings<this> {
		const settings = new TableSettings<this>("needsPaymentId")
		
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
		
		settings.setListFilter(session => SqlWhere(NeedsPayment).is("userId", session.userId))
		settings.setFloatValues("amount")
		
		settings.setOnBeforeAdd((data, db, session) => {
			data.userId = session.userId
		})
		
		return settings
	}
	
	public userId: number | bigint = 0
	public budgetId: number | bigint = 0
}
