import {TableSettings} from "../TableSettings";
import {PubUser} from "../../../../shared/public/PubUser";
import {column} from "../column";
import {UsernameAlreadyExistsException} from "../../exceptions/UsernameAlreadyExistsException";
import {NoPermissionException} from "../../exceptions/NoPermissionException";


export class User extends PubUser {
	getSettings(): TableSettings<this> {
		const settings = new TableSettings<this>()
		
		settings.setOnBeforeEdit((data, db, session) => {
			if(Object.prototype.hasOwnProperty.call(data, "username")) {
				const [existingUser] = db.selectTable(User, `${column(User, "username")} = '${data.username}'`, 1)
				if(existingUser && existingUser.userId != session.userId)
					throw new UsernameAlreadyExistsException()
			}
		})
		settings.setOnBeforeAdd(() => {
			throw new NoPermissionException()
		})
		settings.setListFilter(session => session.isAdmin ? "1" : `${column(User, "userId")} = ${session.userId}`)
		return settings
	}
	
	public userId: number | bigint = 0
	public isAdmin: boolean = false
	public hashedPassword: string = ""
}
