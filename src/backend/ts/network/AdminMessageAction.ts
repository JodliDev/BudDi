import {BaseBackendMessageAction} from "./BaseBackendMessageAction";
import {WebSocketSession} from "./WebSocketSession";
import {DatabaseManager} from "../database/DatabaseManager";
import {BaseMessage} from "../../../shared/BaseMessage";
import {NoPermissionException} from "../exceptions/NoPermissionException";
import {LoggedInMessageAction} from "./LoggedInMessageAction";

export abstract class AdminMessageAction<T extends BaseMessage> extends LoggedInMessageAction<T> {
	
	abstract authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void>
	
	async exec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		if(!session.isAdmin)
			throw new NoPermissionException()
		
		return super.exec(session, db)
	}
}
