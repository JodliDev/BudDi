import {BasePublicTable} from "../BasePublicTable";

export class PubDonationEntry extends BasePublicTable {
	getPrimaryKey(): keyof this {
		return "donationEntryId"
	}
	
	
	public donationEntryId: number | bigint = 0
	public donationName: string = ""
	public homepage: string = ""
	public donationUrl: string = ""
	
	public enabled: boolean = true
	public donationsSum: number = 0
	public donationTimes: number = 0
	public lastDonation: number = 0
}
