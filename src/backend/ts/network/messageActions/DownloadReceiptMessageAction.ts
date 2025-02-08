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
import {DownloadReceiptMessage} from "../../../../shared/messages/DownloadReceiptMessage";
import {NoPermissionException} from "../../exceptions/NoPermissionException";

// noinspection JSUnusedGlobalSymbols
export class DownloadReceiptMessageAction extends LoggedInMessageAction<DownloadReceiptMessage> {
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const [payment] = db.selectTable(Payment, `${column(Payment, "paymentId")} = ${this.data.paymentId}`)
		
		if(payment.userId != session.userId)
			throw new NoPermissionException()
		
		if(payment.receipt)
			session.sendBinary(payment.receipt)
	}
}
