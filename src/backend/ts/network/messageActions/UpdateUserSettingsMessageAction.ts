import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {AuthorisedMessageAction} from "../AuthorisedMessageAction";
import {column} from "../../database/column";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {UpdateUserSettingsMessage} from "../../../../shared/messages/UpdateUserSettingsMessage";
import {User} from "../../database/dataClasses/User";

export class UpdateUserSettingsMessageAction extends AuthorisedMessageAction<UpdateUserSettingsMessage> {
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		db.update(
			User,
			{
				"=": { currency: this.data.userSettings.currency }
			},
			`${column(User, "userId")} = ${session.userId}`
		)
		session.send(new ConfirmResponseMessage(this.data, true))
	}
	
}
