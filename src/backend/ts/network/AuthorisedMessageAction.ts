import {BaseBackendMessageAction} from "./BaseBackendMessageAction";
import {WebSocketSession} from "./WebSocketSession";
import {DatabaseManager} from "../database/DatabaseManager";
import {BaseMessage} from "../../../shared/BaseMessage";
import {NoPermissionException} from "../exceptions/NoPermissionException";

export abstract class AuthorisedMessageAction<T extends BaseMessage> extends BaseBackendMessageAction<T> {
	
	abstract authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void>
	
	async exec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		if(!session.isLoggedIn)
			throw new NoPermissionException()
		
		return this.authorizedExec(session, db)
	}
}
