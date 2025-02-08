import {BaseMessage} from "../../../shared/BaseMessage";
import {ConfirmMessage} from "../../../shared/messages/ConfirmMessage";
import {ConfirmResponseMessage} from "../../../shared/messages/ConfirmResponseMessage";
import {ErrorManager} from "../views/ErrorManager";
import {Lang} from "../../../shared/Lang";
import {BinaryDownloadMessage} from "../../../shared/messages/BinaryDownloadMessage";

export class ExpectedResponseManager {
	private confirmList: Record<number, (response: ConfirmResponseMessage) => void> = {}
	private binaryConfirm: ((response: Blob | null) => void) | null = null;
	
	constructor(private errorManager: ErrorManager) { }
	
	public createBinaryConfirmation(message: BinaryDownloadMessage): Promise<Blob | null> {
		if(this.binaryConfirm)
			this.binaryConfirm(null)
		return new Promise<Blob | null>((resolve) => {
			this.binaryConfirm = resolve
		})
	}
	
	public createConfirmation(message: ConfirmMessage): Promise<ConfirmResponseMessage> {
		return new Promise<ConfirmResponseMessage>((resolve) => {
			this.confirmList[message.confirmId] = resolve
		})
	}
	
	private isResponse(message: BaseMessage | ConfirmResponseMessage): message is ConfirmResponseMessage {
		return (<ConfirmResponseMessage>message).confirmId !== undefined && (<ConfirmResponseMessage>message).success !== undefined
	}
	
	public checkBinary(data: Blob) {
		if(this.binaryConfirm) {
			this.binaryConfirm(data)
			this.binaryConfirm = null
		}
	}
	
	
	public check(message: BaseMessage): boolean {
		if(this.isResponse(message)) {
			const id = message.confirmId
			if(this.confirmList.hasOwnProperty(id)) {
				if(!message.success && message.reason)
					this.errorManager.error(Lang.has(message.reason) ? Lang.getDynamic(message.reason) : message.reason)
				this.confirmList[id](message)
				
				delete this.confirmList[id]
				return true
			}
			else
				return false
		}
		else
			return false
	}
}
