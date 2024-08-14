import {BaseBackendMessageAction} from "../BaseBackendMessageAction";
import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {BaseListEntry} from "../../../../shared/BaseListEntry";
import {DeleteMessage} from "../../../../shared/messages/DeleteMessage";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {AuthorisedMessageAction} from "../AuthorisedMessageAction";
import {Convenience} from "../../Convenience";

export class DeleteMessageAction extends AuthorisedMessageAction<DeleteMessage> {
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		if(!Convenience.stringIsSafe(this.data.listName))
			session.send(new ConfirmResponseMessage(this.data, false))
		const listClass = await import(`../../../../shared/lists/${this.data.listName}`);
		
		if(!listClass)
			session.send(new ConfirmResponseMessage(this.data, false))
		const obj = new listClass[this.data.listName] as BaseListEntry
		
		if(!obj)
			session.send(new ConfirmResponseMessage(this.data, false))
		
		const tableName = obj.getTableName()
		const response = db.unsafeDelete(tableName, `${obj.getPrimaryKey().toString()} = ${this.data.id}`, 1)
		
		session.send(new ConfirmResponseMessage(this.data, response == 1))
		
	}
	
}
