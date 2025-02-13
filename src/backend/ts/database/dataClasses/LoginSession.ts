import {User} from "./User";
import {TableSettings} from "../TableSettings";
import {randomBytes} from "node:crypto";
import {BasePublicTable} from "../../../../shared/BasePublicTable";
import {BackendTableMethods} from "../DatabaseInstructions";

export class LoginSession extends BasePublicTable implements BackendTableMethods {
	getSettings(): TableSettings<this> {
		const settings = new TableSettings<this>("loginSessionId")
		
		settings.setForeignKey("userId", {
			table: User,
			to: "userId",
			on_delete: "CASCADE"
		})
		
		return settings
	}
	
	public loginSessionId: number | bigint = 0
	public userId: number | bigint = 0
	public sessionSecret: string = ""
	public existsSince: number = 0
	public lastLogin: number = 0
	
	public static getNewSession(userId: number | bigint, existsSince?: number): LoginSession {
		const now = Date.now()
		return {
			userId: userId,
			lastLogin: now,
			existsSince: existsSince ?? now,
			sessionSecret: randomBytes(20).toString('hex')
		} as LoginSession
	}
}
