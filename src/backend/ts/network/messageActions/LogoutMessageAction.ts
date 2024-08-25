import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {column} from "../../database/column";
import {LoginSession} from "../../database/dataClasses/LoginSession";
import {LogoutMessage} from "../../../../shared/messages/LogoutMessage";
import {LoggedInMessageAction} from "../LoggedInMessageAction";

export class LogoutMessageAction extends LoggedInMessageAction<LogoutMessage> {
	
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const [loginSession] = db.selectTable(LoginSession, `${column(LoginSession, "userId")} = '${session.userId}'`, 1)

		if(!loginSession)
			return
		db.delete(LoginSession, `userId = ${session.userId}`, 1)
		
		session.logout()
	}
}
