import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {LoggedInMessageAction} from "../LoggedInMessageAction";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {Budget} from "../../database/dataClasses/Budget";
import {NeedsPayment} from "../../database/dataClasses/NeedsPayment";
import {AddPaymentMessage} from "../../../../shared/messages/AddPaymentMessage";
import {History} from "../../database/dataClasses/History";
import {Payment} from "../../database/dataClasses/Payment";
import {SqlWhere} from "../../database/SqlWhere";
import {FaultyInputException} from "../../exceptions/FaultyInputException";
import {PubUser} from "../../../../shared/public/PubUser";

// noinspection JSUnusedGlobalSymbols
export class AddPaymentMessageAction extends LoggedInMessageAction<AddPaymentMessage> {
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		if(!this.isType(this.data.amount, "number") || (this.data.receiptFileName && this.data.receiptFileName.length < Payment.RECIPE_FILE_NAME_MIN_LENGTH))
			throw new FaultyInputException()
		
		const [budget] = db.selectTable(Budget, SqlWhere(Budget).is("budgetId", this.data.budgetId), 1)
		//We assume that there always will be only one entry per budget: 
		const [needsPayment] = db.selectTable(NeedsPayment, SqlWhere(NeedsPayment).is("budgetId", this.data.budgetId), 1)
		
		if(needsPayment) {
			if(needsPayment.budgetId != budget.budgetId)
				throw new FaultyInputException()
			
			if(this.data.amount >= needsPayment.amount)
				db.delete(NeedsPayment, SqlWhere(NeedsPayment).is("needsPaymentId", needsPayment.needsPaymentId))
			else
				db.update(NeedsPayment, {"-=": {"amount": this.data.amount}}, SqlWhere(NeedsPayment).is("needsPaymentId", needsPayment.needsPaymentId))
		}
		
		
		db.update(
			Budget, 
			{
				"=": {
					lastPayment: Date.now(),
					spendingSum: budget.spendingSum + this.data.amount,
					spendingTimes: budget.spendingTimes + 1
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
		
		const [user] = db.selectTable(PubUser, SqlWhere(PubUser).is("userId", session.userId), 1)
		
		History.addHistory(db, session.userId!, "historyAddPayment", [this.data.amount, user.currency, budget.budgetName], budget.budgetId)
		session.send(new ConfirmResponseMessage(this.data, true))
	}
}
