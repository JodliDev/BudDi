import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {LoggedInMessageAction} from "../LoggedInMessageAction";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {Budget} from "../../database/dataClasses/Budget";
import {NeedsPayment} from "../../database/dataClasses/NeedsPayment";
import {Payment} from "../../database/dataClasses/Payment";
import {SqlWhere} from "../../database/SqlWhere";
import {FaultyInputException} from "../../exceptions/FaultyInputException";
import {EditPaymentMessage} from "../../../../shared/messages/EditPaymentMessage";

// noinspection JSUnusedGlobalSymbols
export class EditPaymentMessageAction extends LoggedInMessageAction<EditPaymentMessage> {
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		if(!this.isType(this.data.amount, "number") || (this.data.receiptFileName && this.data.receiptFileName.length < Payment.RECIPE_FILE_NAME_MIN_LENGTH))
			throw new FaultyInputException()
		
		const [payment] = db.selectTable(Payment, {where: SqlWhere(Payment).is("paymentId", this.data.paymentId), limit: 1})
		if(!payment)
			throw new FaultyInputException()
		const diffAmount = payment.amount - this.data.amount
		
		//correct needsPayment:
		const [needsPayment] = db.selectTable(NeedsPayment, {where: SqlWhere(NeedsPayment).is("budgetId", payment.budgetId), limit: 1})
		
		if(needsPayment) {
			if(needsPayment.amount - diffAmount <= 0)
				db.delete(NeedsPayment, SqlWhere(NeedsPayment).is("needsPaymentId", needsPayment.needsPaymentId))
			else
				db.update(NeedsPayment, {"-=": {"amount": diffAmount}}, SqlWhere(NeedsPayment).is("needsPaymentId", needsPayment.needsPaymentId))
		}
		
		//update budget statistics:
		db.update(
			Budget,
			{
				"+=": {
					spendingSum: diffAmount,
				}
			},
			SqlWhere(Budget).is("budgetId", payment.budgetId)
		)
		
		//update payment entry:
		
		if(this.data.deleteExistingReceipt)
			db.fileDataStore.deleteFile(payment.receiptFileId)
		
		let fileId: number | bigint = 0
		if(this.data.receiveFile)
			fileId = db.fileDataStore.saveFile(this.data.receiveFile)
		
		db.update(
			Payment,
			{
				"=": {
					amount: this.data.amount,
					receiptFileId: fileId,
					receiptFileType: this.data.receiptFileType,
					receiptFileName: this.data.receiptFileName
				}
			},
			SqlWhere(Payment).is("paymentId", payment.paymentId)
		)
		
		session.send(new ConfirmResponseMessage(this.data, true))
	}
}
