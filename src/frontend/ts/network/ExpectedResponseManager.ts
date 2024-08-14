import {BaseMessage} from "../../../shared/BaseMessage";
import {ConfirmMessage} from "../../../shared/messages/ConfirmMessage";
import {Class} from "../../../shared/Class";
import {ConfirmResponseMessage} from "../../../shared/messages/ConfirmResponseMessage";

export class ExpectedResponseManager {
	private confirmList: Record<number, (response: ConfirmResponseMessage) => void> = {};
	
	public createConfirmation(message: ConfirmMessage): Promise<ConfirmResponseMessage> {
		return new Promise<ConfirmResponseMessage>((resolve) => {
			this.confirmList[message.confirmId] = resolve
		})
	}
	
	private isResponse(message: BaseMessage | ConfirmResponseMessage): message is ConfirmResponseMessage {
		return (<ConfirmResponseMessage>message).confirmId !== undefined && (<ConfirmResponseMessage>message).success !== undefined
	}
	
	public check(message: BaseMessage): boolean {
		const className = message.name
		
		console.log(message, message instanceof ConfirmResponseMessage)
		if(this.isResponse(message)) {
			const id = message.confirmId
			if(this.confirmList.hasOwnProperty(id)) {
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
