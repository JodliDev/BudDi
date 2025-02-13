import {BasePublicTable} from "../BasePublicTable";
import {ScheduleRepeatOptions} from "../ScheduleRepeatOptions";
import {LangKey} from "../Lang";

export class PubSchedule extends BasePublicTable implements ScheduleRepeatOptions {
	getTranslation(key: keyof this): LangKey {
		switch(key) {
			case "count":
				return "paymentCount"
			default:
				return key as LangKey
		}
	}
	
	public scheduleId: number | bigint = 0
	public enabled: boolean = true
	public nextLoop: number = 0
	public lastLoop: number = 0
	public repeatDays: number = 1
	public fixedDayOfMonth: number = 1
	public amount: number = 10
	public count: number = 1
}
