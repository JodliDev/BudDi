import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {column} from "../../database/column";
import {LoginSession} from "../../database/dataClasses/LoginSession";
import {LogoutMessage} from "../../../../shared/messages/LogoutMessage";
import {AuthorisedMessageAction} from "../AuthorisedMessageAction";

export class LogoutMessageAction extends AuthorisedMessageAction<LogoutMessage> {
	
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const [loginSession] = db.quickSelect(LoginSession, `${column(LoginSession, "userId")} = '${session.userId}'`, 1)

		if(!loginSession)
			return
		db.delete(LoginSession, `userId = ${session.userId}`, 1)
		
		session.logout()
	}
}
