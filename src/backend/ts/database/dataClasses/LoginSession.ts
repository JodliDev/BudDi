import {User} from "./User";
import {TableSettings} from "../TableSettings";
import {randomBytes} from "node:crypto";
import {BasePublicTable} from "../../../../shared/BasePublicTable";

export class LoginSession extends BasePublicTable {
	getPrimaryKey(): keyof this {
		return "loginSessionId"
	}
	
	getSettings(): TableSettings<this> {
		const settings = new TableSettings<this>()
		
		settings.setForeignKey("userId", {
			table: User,
			to: "userId",
			on_delete: "CASCADE"
		})
		
		return settings
	}
	
	public loginSessionId: number | bigint = 0
	public userId: number | bigint = 0
	public sessionHash: string = ""
	public existsSince: number = 0
	public lastUpdate: number = 0
	
	public static getNewSession(userId: number | bigint, existsSince?: number): LoginSession {
		const now = Date.now()
		return {
			userId: userId,
			lastUpdate: now,
			existsSince: existsSince ?? now,
			sessionHash: randomBytes(20).toString('hex')
		} as LoginSession
	}
}
