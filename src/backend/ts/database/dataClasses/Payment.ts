import {TableSettings} from "../TableSettings";
import {PubPayment} from "../../../../shared/public/PubPayment";
import {Budget} from "./Budget";
import {User} from "./User";
import {SqlWhere} from "../SqlWhere";


export class Payment extends PubPayment {
	getSettings(): TableSettings<this> {
		const settings = new TableSettings<this>()
		
		settings.setDataType("receipt", "blob")
		
		settings.setForeignKey("userId", {
			table: User,
			to: "userId",
			on_delete: "CASCADE"
		})
		
		settings.setForeignKey("budgetId", {
			table: Budget,
			to: "budgetId",
			on_delete: "CASCADE",
			isPublic: true
		})
		
		settings.setOnBeforeAdd((data, db, session) => {
			data.userId = session.userId
		})
		
		settings.setListFilter(session => SqlWhere(Payment).is("userId", session.userId))
		settings.setAllowedOrderColumns(["paymentTime"])
		return settings
	}
	
	public userId: number | bigint = 0
	public receipt: ArrayBuffer | Buffer | Buffer[] | null = null
}
