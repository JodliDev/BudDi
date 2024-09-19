import {BasePublicTable} from "../BasePublicTable";
import {LangKey} from "../Lang";

export class PubDonationEntry extends BasePublicTable {
	getTranslation(key: keyof PubDonationEntry): LangKey {
		switch(key) {
			case "donationName":
				return "name"
			case "enabled":
			case "homepage":
			case "donationUrl":
				return key
			default:
				return key as LangKey
		}
	}
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
