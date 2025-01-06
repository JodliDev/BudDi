import { ConfirmManager } from "./ConfirmManager";
import {ExpectedResponseManager} from "./ExpectedResponseManager";
import {BaseMessage} from "../../../shared/BaseMessage";
import {BaseFrontendMessageAction} from "./BaseFrontendMessageAction";
import {Site} from "../views/Site";
import {ConfirmMessage} from "../../../shared/messages/ConfirmMessage";
import {ConfirmResponseMessage} from "../../../shared/messages/ConfirmResponseMessage";

export class FrontendWebSocketHelper {
	private static readonly PATH = "websocket"
	
	private socket?: WebSocket
	private confirmBox: ConfirmManager = new ConfirmManager()
	private expectedResponseManager: ExpectedResponseManager = new ExpectedResponseManager()
	private waitPromise?: Promise<void>
	
	constructor(private site: Site) {
		
	}
	
	
	private createSocket(): WebSocket {
		const protocol = location.protocol === "http:" ? "ws" : "wss"
		const socket = new WebSocket(`${ protocol }://${ document.location.hostname }:${ document.location.port }/${ FrontendWebSocketHelper.PATH }`)
		this.socket = socket
		this.waitPromise = new Promise<void>((resolve, reject) => {
			socket.addEventListener("open", () => resolve())
			socket.addEventListener("error", () => reject())
		})
		this.socket.addEventListener("message", this.onMessage.bind(this))
		socket.addEventListener("close", this.onClose.bind(this))
		
		return socket
	}
	
	async onMessage(event: MessageEvent): Promise<void> {
		try {
			const message = JSON.parse(event.data.toString()) as BaseMessage
			
			if(!this.expectedResponseManager.check(message)) {
				const className = `${message.name}Action`
				const messageClass = await import(`./messageActions/${className}`);
				if(messageClass) {
					const messageAction = new messageClass[className](message) as BaseFrontendMessageAction<BaseMessage>;
					messageAction.exec(this.site)
				}
			}
		}
		catch(error: unknown) {
			this.site.errorManager.error(`Could not parse message.\nData: ${event.data}\nError: ${error}`)
		}
	}
	private onClose(event: CloseEvent): void {
		this.site.errorManager.error("Lost connection to server")
	}
	
	public isConnected(): boolean {
		return this.socket?.readyState === WebSocket.OPEN;
	}
	
	public send(message: BaseMessage) {
		const json = JSON.stringify(message)
		this.socket?.send(json)
	}
	
	public sendAndReceive(message: ConfirmMessage): Promise<ConfirmResponseMessage> {
		const r = this.expectedResponseManager.createConfirmation(message)
		this.send(message)
		return r
	}
	
	public async waitUntilReady(throwError: boolean = false): Promise<void> {
		try {
			return await this.waitPromise || Promise.resolve();
		} catch(error) {
			if(throwError)
				throw error;
			else
				this.site.errorManager.error(error)
		}
	}
	public connect(): void {
		this.socket = this.createSocket()
	}
}
