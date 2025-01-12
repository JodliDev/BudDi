import {BasePublicTable} from "../BasePublicTable";

export class PubUser extends BasePublicTable {
	getPrimaryKey(): keyof this {
		return "userId"
	}
	
	public userId: number | bigint = 0
	public username: string = ""
	
	public currency: string = "€"
}
