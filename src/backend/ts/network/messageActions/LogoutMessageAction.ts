import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {LoginSession} from "../../database/dataClasses/LoginSession";
import {LogoutMessage} from "../../../../shared/messages/LogoutMessage";
import {LoggedInMessageAction} from "../LoggedInMessageAction";
import {SqlWhere} from "../../database/SqlWhere";

// noinspection JSUnusedGlobalSymbols
export class LogoutMessageAction extends LoggedInMessageAction<LogoutMessage> {
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const [loginSession] = db.selectTable(LoginSession, SqlWhere(LoginSession).is("userId", session.userId), 1)

		if(!loginSession)
			return
		db.delete(LoginSession, SqlWhere(LoginSession).is("userId", session.userId), 1)
		
		session.logout()
	}
}
