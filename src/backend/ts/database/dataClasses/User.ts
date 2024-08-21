import {TableSettings} from "../TableSettings";
import {PubUser} from "../../../../shared/public/PubUser";
import {column} from "../column";
import {UsernameAlreadyExistsException} from "../../exceptions/UsernameAlreadyExistsException";


export class User extends PubUser {
	getPrimaryKey(): keyof this {
		return "userId"
	}
	getSettings(): TableSettings<this> {
		const settings = new TableSettings<this>()
		
		settings.setOnBeforeEdit((data, db, userId) => {
			if(Object.prototype.hasOwnProperty.call(data, "username")) {
				const [existingUser] = db.tableSelect(User, `${column(User, "username")} = '${data.username}'`, 1)
				if(existingUser && existingUser.userId != userId)
					throw new UsernameAlreadyExistsException()
			}
		})
		settings.setListFilter(userId => `${column(User, "userId")} = ${userId}`)
		settings.setFloatValues("donationAmount")
		return settings
	}
	
	public userId: number | bigint = 0
	public isAdmin: boolean = false
	public hashedPassword: string = ""
}
