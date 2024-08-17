import {BasePublicTable} from "../../../../shared/BasePublicTable";
import {TableSettings} from "../TableSettings";

export enum DonationAmountType {
	Fixed,
	PerEntry
}

export class User extends BasePublicTable {
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
	public donationAmountType: number = DonationAmountType.PerEntry
	public donationAmount: number = 1
	
	public currency: string = "€"
}
