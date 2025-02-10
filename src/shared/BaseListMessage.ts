import {ConfirmMessage} from "./messages/ConfirmMessage";

export abstract class BaseListMessage extends ConfirmMessage {
	abstract readonly listName: string
}
