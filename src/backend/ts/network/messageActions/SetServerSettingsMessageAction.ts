import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {Options} from "../../Options";
import {SetServerSettingsMessage} from "../../../../shared/messages/SetServerSettingsMessage";
import {AdminMessageAction} from "../AdminMessageAction";

export class SetServerSettingsMessageAction extends AdminMessageAction<SetServerSettingsMessage> {
	async authorizedExec(session: WebSocketSession, _: DatabaseManager): Promise<void> {
		Options.serverSettings = this.data.serverSettings
		session.send(new ConfirmResponseMessage(this.data, true))
	}
}
