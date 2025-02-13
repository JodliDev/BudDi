import {TableSettings} from "../TableSettings";
import {PubUser} from "../../../../shared/public/PubUser";
import {UsernameAlreadyExistsException} from "../../exceptions/UsernameAlreadyExistsException";
import {NoPermissionException} from "../../exceptions/NoPermissionException";
import {SqlWhere} from "../SqlWhere";
import {BackendTableMethods} from "../DatabaseInstructions";


export class User extends PubUser implements BackendTableMethods {
	getSettings(): TableSettings<this> {
		const settings = new TableSettings<this>("userId")
		
		settings.setOnBeforeEdit((data, db, session) => {
			if(Object.prototype.hasOwnProperty.call(data, "username")) {
				const [existingUser] = db.selectTable(User, {where: SqlWhere(User).is("username", data.username), limit: 1})
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
