import {User} from "./User";
import {TableSettings} from "../TableSettings";
import {PubSchedule} from "../../../../shared/public/PubSchedule";
import {DailyScheduleManager} from "../../DailyScheduleManager";
import {SqlWhere} from "../SqlWhere";

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
				data.lastLoop ?? Date.now()
			)
		}
		
		settings.setOnBeforeAdd((data, _, session) => {
			data.userId = session.userId
			data.lastLoop = Date.now()
			setNextLoop(data)
		})
		
		settings.setOnBeforeEdit((data) => setNextLoop(data))
		settings.setListFilter(session => SqlWhere(Schedule).is("userId", session.userId))
		
		settings.setFloatValues("spendingAmount")
		
		return settings
	}
	
	public userId: number | bigint = 0
}
