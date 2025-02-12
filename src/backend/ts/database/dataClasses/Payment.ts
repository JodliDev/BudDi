import {TableSettings} from "../TableSettings";
import {PubPayment} from "../../../../shared/public/PubPayment";
import {Budget} from "./Budget";
import {User} from "./User";
import {SqlWhere} from "../SqlWhere";


export class Payment extends PubPayment {
	static readonly RECIPE_FILE_NAME_MIN_LENGTH: number = 3
	
	getSettings(): TableSettings<this> {
		const settings = new TableSettings<this>()
		
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
		
		settings.setListFilter(session => SqlWhere(Payment).is("userId", session.userId))
		settings.setAllowedFilterColumn(Payment, "budgetId")
		settings.setAllowedFilterColumn(Payment, "paymentTime")
		settings.setAllowedFilterColumn(Budget, "isTaxExempt")
		return settings
	}
	
	public userId: number | bigint = 0
	public receiptFileId: number | bigint = 0
}
