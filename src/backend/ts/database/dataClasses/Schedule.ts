import {DonationEntry} from "./DonationEntry";
import {User} from "./User";
import {TableSettings} from "../TableSettings";
import {PubWaitingEntry} from "../../../../shared/public/PubWaitingEntry";
import {PubSchedule} from "../../../../shared/public/PubSchedule";
import {WaitingEntry} from "./WaitingEntry";
import {DailyScheduleManager} from "../../DailyScheduleManager";
import {column} from "../column";

export class Schedule extends PubSchedule {
	getSettings(): TableSettings<this> {
		const settings = new TableSettings<this>()
		
		settings.setForeignKey("userId", {
			table: User,
			to: "userId",
			on_delete: "CASCADE"
		})
		
		const setNextLoop = (data: Partial<this>) => {
			const defaults = new PubSchedule()
			data.nextLoop = DailyScheduleManager.considerOptions(
				{
					repeatDays: data.repeatDays ?? defaults.repeatDays,
					fixedDayOfMonth: data.fixedDayOfMonth ?? defaults.fixedDayOfMonth
				},
				Date.now()
			)
		}
		
		settings.setOnBeforeAdd((data, _, session) => {
			data.userId = session.userId
			setNextLoop(data)
		})
		
		settings.setOnBeforeEdit((data) => setNextLoop(data))
		settings.setListFilter(session => `${column(Schedule, "userId")} = ${session.userId}`)
		
		return settings
	}
	
	public userId: number | bigint = 0
}
