import {BaseBackendMessageAction} from "../BaseBackendMessageAction";
import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {BaseListEntry} from "../../../../shared/BaseListEntry";
import {DeleteMessage} from "../../../../shared/messages/DeleteMessage";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {AuthorisedMessageAction} from "../AuthorisedMessageAction";
import {Convenience} from "../../Convenience";
import {ListMessageAction} from "./ListMessageAction";

export class DeleteMessageAction extends AuthorisedMessageAction<DeleteMessage> {
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const publicListClass = await ListMessageAction.getPublicListClass(this.data)
		const obj = new publicListClass
		const listClass = await ListMessageAction.getListClass(this.data, obj)
		
		
		const response = db.delete(listClass, `${obj.getPrimaryKey().toString()} = ${this.data.id}`, 1)
		
		session.send(new ConfirmResponseMessage(this.data, response == 1))
		
	}
	
}
