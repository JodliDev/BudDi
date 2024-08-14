import {BasePublicTable} from "../../../../shared/BasePublicTable";
import {TableSettings} from "../TableSettings";

export class User extends BasePublicTable {
	getPrimaryKey(): keyof this {
		return "userId"
	}
	getSettings(): TableSettings<this> {
		const settings = new TableSettings<this>()
		settings.setFloatValues("donationAmount", "donationAmountPerEntry")
		return settings
	}
	
	public userId: number | bigint = 0
	public username: string = ""
	public isAdmin: boolean = false
	public hashedPassword: string = ""
	public donationAmount: number = 1
	public donationAmountPerEntry: number = 0
	
	getForeignKey() {
		return {};
	}
}
