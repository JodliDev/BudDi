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
		const publicListClass = await ListMessageAction.getPublicListClassFromMessage(this.data)
		const publicObj = new publicListClass
		const listClass = await ListMessageAction.getListClass(this.data, publicObj)
		const listObj = new listClass
		
		const settings = listObj.getSettings && listObj.getSettings()
		const where = `${publicObj.getPrimaryKey().toString()} = ${this.data.id}`
		
		const response = db.delete(listClass, settings?.getWhere(session.userId!, where) ?? where, 1)
		
		session.send(new ConfirmResponseMessage(this.data, response == 1))
		
	}
	
}
