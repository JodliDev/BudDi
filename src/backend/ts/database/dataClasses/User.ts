import {TableSettings} from "../TableSettings";
import {PubUser} from "../../../../shared/public/PubUser";
import {UsernameAlreadyExistsException} from "../../exceptions/UsernameAlreadyExistsException";
import {NoPermissionException} from "../../exceptions/NoPermissionException";
import {SqlWhere} from "../SqlWhere";


export class User extends PubUser {
	getSettings(): TableSettings<this> {
		const settings = new TableSettings<this>()
		
		settings.setOnBeforeEdit((data, db, session) => {
			if(Object.prototype.hasOwnProperty.call(data, "username")) {
				const [existingUser] = db.selectTable(User, SqlWhere(User).is("username", data.username), 1)
				if(existingUser && existingUser.userId != session.userId)
					throw new UsernameAlreadyExistsException()
			}
		})
		settings.setOnBeforeAdd((_data, _db, session) => {
			throw new NoPermissionException()
		})
		settings.setListFilter(session => session.isAdmin ? SqlWhere(User) : SqlWhere(User).is("userId", session.userId))
		return settings
	}
	
	public userId: number | bigint = 0
	public isAdmin: boolean = false
	public hashedPassword: string = ""
}
