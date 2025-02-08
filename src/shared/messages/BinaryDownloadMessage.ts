import {ConfirmMessage} from "./ConfirmMessage";
import {BaseMessage} from "../BaseMessage";

export class BinaryDownloadMessage extends ConfirmMessage {
	public readonly wantsBinaryMessage: boolean = true;
	
	public static isBinaryDownloadMessage(message: BaseMessage): message is BinaryDownloadMessage {
		return (message as BinaryDownloadMessage).wantsBinaryMessage
	}
}
