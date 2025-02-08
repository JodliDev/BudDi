import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {column} from "../../database/column";
import {LoggedInMessageAction} from "../LoggedInMessageAction";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {Budget} from "../../database/dataClasses/Budget";
import {NeedsPayment} from "../../database/dataClasses/NeedsPayment";
import {SetAsPaidMessage} from "../../../../shared/messages/SetAsPaidMessage";
import {History} from "../../database/dataClasses/History";
import {Payment} from "../../database/dataClasses/Payment";

// noinspection JSUnusedGlobalSymbols
export class SetAsPaidMessageAction extends LoggedInMessageAction<SetAsPaidMessage> {
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const [dbData] = db.selectJoinedTable(
			NeedsPayment,
			["budgetId", "needsPaymentId"],
			[
				{
					joinedTable: Budget,
					select: ["budgetName"],
					on: `${column(NeedsPayment, "budgetId")} = ${column(Budget, "budgetId")}`,
				}
			],
			`${column(NeedsPayment, "userId")} = ${session.userId} AND ${column(NeedsPayment, "needsPaymentId")} = ${this.data.needsPaymentId}`,
			1,
		)
		const needsPaymentEntry = dbData.item
		const budget = dbData.joined["Budget"] as Budget
		
		if(!needsPaymentEntry) {
			session.send(new ConfirmResponseMessage(this.data, false))
			return
		}
		
		db.update(
			Budget, 
			{
				"+=": {
					lastPayment: Date.now(),
					spendingSum: this.data.amount,
					spendingTimes: 1
				}
			},
			`${column(Budget, "budgetId")} = ${needsPaymentEntry.budgetId}`
		)
		
		const payment: Partial<Payment> = {
			userId: session.userId,
			budgetId: needsPaymentEntry.budgetId,
			paymentTime: Date.now(),
			amount: this.data.amount,
			receipt: this.data.receiveFile,
			receiptFileType: this.data.receiptFileType,
			receiptFileName: this.data.receiptFileName
		}
		db.insert(Payment, payment)
		
		History.addHistory(db, session.userId!, "historySetAsPaid", [budget.budgetName], needsPaymentEntry.budgetId)
		db.delete(NeedsPayment, `${column(NeedsPayment, "needsPaymentId")} = ${needsPaymentEntry.needsPaymentId}`)
		session.send(new ConfirmResponseMessage(this.data, true))
	}
}
