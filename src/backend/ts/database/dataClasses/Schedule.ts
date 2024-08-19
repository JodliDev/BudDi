import {DonationEntry} from "./DonationEntry";
import {User} from "./User";
import {TableSettings} from "../TableSettings";
import {PubWaitingEntry} from "../../../../shared/public/PubWaitingEntry";
import {PubSchedule} from "../../../../shared/public/PubSchedule";
import {WaitingEntry} from "./WaitingEntry";

export class Schedule extends PubSchedule {
	getSettings(): TableSettings<this> {
		const settings = new TableSettings<this>()
		
		settings.setForeignKey("userId", {
			table: User,
			to: "userId",
			on_delete: "CASCADE"
		})
		
		settings.setOnBeforeAdd((data, db, userId) => {
			data.userId = userId
		})
		
		return settings
	}
	
	public userId: number | bigint = 0
}
