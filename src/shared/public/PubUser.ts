import {BasePublicTable} from "../BasePublicTable";

export enum DonationAmountType {
	Fixed,
	PerEntry
}

export class PubUser extends BasePublicTable {
	getPrimaryKey(): keyof this {
		return "userId"
	}
	
	public userId: number | bigint = 0
	public donationAmountType: number = DonationAmountType.PerEntry
	public donationAmount: number = 1
	
	public currency: string = "€"
}
