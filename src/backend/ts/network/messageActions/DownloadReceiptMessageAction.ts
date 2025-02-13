import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {LoggedInMessageAction} from "../LoggedInMessageAction";
import {Payment} from "../../database/dataClasses/Payment";
import {DownloadReceiptMessage} from "../../../../shared/messages/DownloadReceiptMessage";
import {NoPermissionException} from "../../exceptions/NoPermissionException";
import {SqlWhere} from "../../database/SqlWhere";

// noinspection JSUnusedGlobalSymbols
export class DownloadReceiptMessageAction extends LoggedInMessageAction<DownloadReceiptMessage> {
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const [payment] = db.selectTable(Payment, {where: SqlWhere(Payment).is("paymentId", this.data.paymentId)})
		
		if(payment.userId != session.userId)
			throw new NoPermissionException()
		
		if(payment.receiptFileId) {
			const file = db.fileDataStore.getFile(payment.receiptFileId)
			if(file)
				session.sendBinary(file)
		}
	}
}
