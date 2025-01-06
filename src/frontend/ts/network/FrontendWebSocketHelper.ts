import {ExpectedResponseManager} from "./ExpectedResponseManager";
import {BaseMessage} from "../../../shared/BaseMessage";
import {BaseFrontendMessageAction} from "./BaseFrontendMessageAction";
import {Site} from "../views/Site";
import {ConfirmMessage} from "../../../shared/messages/ConfirmMessage";
import {ConfirmResponseMessage} from "../../../shared/messages/ConfirmResponseMessage";
import {Lang} from "../../../shared/Lang";
import {KeepAliveMessage} from "../../../shared/messages/KeepAliveMessage";
import {IPublicOptions} from "../../../shared/IPublicOptions";

export class FrontendWebSocketHelper {
	private static readonly PATH = "websocket"
	private static readonly KEEPALIVE_TIMEOUT = 1000*60*5
	
	private socket?: WebSocket
	private expectedResponseManager: ExpectedResponseManager = new ExpectedResponseManager()
	private waitPromise?: Promise<void>
	private isReconnecting = false;
	private keepAliveTimeoutId = 0
	private readonly keepAliveTimeoutMs: number
	
	constructor(private site: Site, options: IPublicOptions) {
		this.keepAliveTimeoutMs = options.keepAliveTimeoutMs
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
	
	private sendKeepAlive(): void {
		window.clearTimeout(this.keepAliveTimeoutId)
		this.keepAliveTimeoutId = window.setTimeout(() => {
			this.send(new KeepAliveMessage())
		}, this.keepAliveTimeoutMs)
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
			this.site.errorManager.error(Lang.get("errorCouldNotParseData", event.data, error as string))
		}
	}
	private onClose(event: CloseEvent): void {
		if(!event.wasClean) {
			this.site.errorManager.error(Lang.get("errorLostConnection"))
			console.log(event)
			if(!this.isReconnecting) {
				
				this.site.errorManager.warn(Lang.get("infoReconnecting"))
				this.connect()
			}
			this.isReconnecting = true
		}
	}
	
	public isConnected(): boolean {
		return this.socket?.readyState === WebSocket.OPEN;
	}
	
	public send(message: BaseMessage) {
		const json = JSON.stringify(message)
		this.socket?.send(json)
		this.sendKeepAlive()
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
