import {BasePublicTable} from "../../../../shared/BasePublicTable";

export class User extends BasePublicTable {
	getPrimaryKey(): keyof this {
		return "userId"
	}
	
	public userId: number | bigint = 0
	public username: string = ""
	public isAdmin: boolean = false
	public hashedPassword: string = ""
	public donationAmount: number = 1
	public donationAmountPerEntry: number = 0.1
	
	getForeignKey() {
		return {};
	}
}
