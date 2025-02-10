import {WebSocketSession} from "./WebSocketSession";
import {DatabaseManager} from "../database/DatabaseManager";
import {BaseMessage} from "../../../shared/BaseMessage";

export abstract class BaseBackendMessageAction<T extends BaseMessage> {
	public abstract exec(session: WebSocketSession, db: DatabaseManager): Promise<void>
	
	constructor(protected data: T) { }
	
	protected isType(value: unknown, type: "string" | "number" | "boolean"): boolean {
		return typeof value === type
	}
	protected stringIsSafe(value: string): boolean {
		return value.match(/^([A-Za-z0-9 ])+$/) != null
	}
}
