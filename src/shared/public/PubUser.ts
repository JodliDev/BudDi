import {BasePublicTable} from "../BasePublicTable";

export enum SpendingAmountType {
	Fixed,
	PerEntry
}

export class PubUser extends BasePublicTable {
	getPrimaryKey(): keyof this {
		return "userId"
	}
	
	public userId: number | bigint = 0
	public username: string = ""
	public spendingAmountType: number = SpendingAmountType.PerEntry
	public spendingAmount: number = 1
	
	public currency: string = "€"
}
