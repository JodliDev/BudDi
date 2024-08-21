import {TableSettings} from "../TableSettings";
import {PubUser} from "../../../../shared/public/PubUser";


export class User extends PubUser {
	getPrimaryKey(): keyof this {
		return "userId"
	}
	getSettings(): TableSettings<this> {
		const settings = new TableSettings<this>()
		settings.setFloatValues("donationAmount")
		return settings
	}
	
	public userId: number | bigint = 0
	public username: string = ""
	public isAdmin: boolean = false
	public hashedPassword: string = ""
}
