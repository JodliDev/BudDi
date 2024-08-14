import {ListMessage} from "../../../../shared/messages/ListMessage";
import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {BaseListEntry} from "../../../../shared/BaseListEntry";
import {ListResponseMessage} from "../../../../shared/messages/ListResponseMessage";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {AuthorisedMessageAction} from "../AuthorisedMessageAction";

export class ListMessageAction extends AuthorisedMessageAction<ListMessage> {
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const listClass = await import(`../../../../shared/lists/${this.data.listName}`);
		if(!listClass)
			session.send(new ConfirmResponseMessage(this.data, false))
		
		const obj = new listClass[this.data.listName] as BaseListEntry
		if(!obj)
			session.send(new ConfirmResponseMessage(this.data, false))
		
		const tableName = obj.getTableName()
		
		const response = db.unsafeSelect(tableName, obj.getColumnNames(), undefined, this.data.limit, this.data.from)
		const count = db.getCount(tableName)
		
		session.send(new ListResponseMessage(this.data, true, response as BaseListEntry[], obj.getPrimaryKey().toString(), count))
		
	}
	
}
