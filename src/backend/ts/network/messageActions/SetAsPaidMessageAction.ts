import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {LoggedInMessageAction} from "../LoggedInMessageAction";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {Budget} from "../../database/dataClasses/Budget";
import {NeedsPayment} from "../../database/dataClasses/NeedsPayment";
import {SetAsPaidMessage} from "../../../../shared/messages/SetAsPaidMessage";
import {History} from "../../database/dataClasses/History";
import {Payment} from "../../database/dataClasses/Payment";
import {SqlWhere} from "../../database/SqlWhere";
import {PubBudget} from "../../../../shared/public/PubBudget";
import {FaultyInputException} from "../../exceptions/FaultyInputException";

// noinspection JSUnusedGlobalSymbols
export class SetAsPaidMessageAction extends LoggedInMessageAction<SetAsPaidMessage> {
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		if(!this.isType(this.data.amount, "number"))
			throw new FaultyInputException()
		
		const [budget] = db.selectTable(PubBudget, SqlWhere(PubBudget).is("budgetId", this.data.budgetId), 1)
		
		if(this.data.needsPaymentId){
			const [needsPayment] = db.selectTable(NeedsPayment, SqlWhere(NeedsPayment).is("needsPaymentId", this.data.needsPaymentId), 1)
			if(needsPayment.budgetId != budget.budgetId)
				throw new FaultyInputException()
			
			db.delete(NeedsPayment, SqlWhere(NeedsPayment).is("needsPaymentId", needsPayment.needsPaymentId))
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
			SqlWhere(Budget).is("budgetId", budget.budgetId)
		)
		
		const payment: Partial<Payment> = {
			userId: session.userId,
			budgetId: budget.budgetId,
			paymentTime: Date.now(),
			amount: this.data.amount,
			receipt: this.data.receiveFile,
			receiptFileType: this.data.receiptFileType,
			receiptFileName: this.data.receiptFileName
		}
		db.insert(Payment, payment)
		
		History.addHistory(db, session.userId!, "historyAddPayment", [this.data.amount, budget.budgetName], budget.budgetId)
		session.send(new ConfirmResponseMessage(this.data, true))
	}
}
