import {ConfirmMessage} from "./ConfirmMessage";
import {BaseMessage} from "../BaseMessage";

export class BinaryUploadMessage extends ConfirmMessage {
	public isBinaryMessage: boolean = true;
	public sendFile: Blob | undefined = undefined
	public receiveFile: ArrayBuffer | Buffer | Buffer[] | undefined
	public readonly initialConfirm: ConfirmMessage
	
	constructor(
		sendFile: Blob | undefined,
	) {
		super()
		this.sendFile = sendFile
		this.initialConfirm = new ConfirmMessage()
	}
	
	public static isBinaryMessage(message: BaseMessage): message is BinaryUploadMessage {
		return (message as BinaryUploadMessage).isBinaryMessage
	}
}
