import {BasePublicTable} from "../BasePublicTable";
import {ScheduleRepeatOptions} from "../ScheduleRepeatOptions";

export class PubSchedule extends BasePublicTable implements ScheduleRepeatOptions {
	getPrimaryKey(): keyof this {
		return "scheduleId"
	}
	
	public scheduleId: number | bigint = 0
	public enabled: boolean = true
	public nextLoop: number = 0
	public lastLoop: number = 0
	public repeatDays: number = 1
	public fixedDayOfMonth: number = 1
	public spendingAmount: number = 10
	public spendingCount: number = 1
}
