import {ScheduleRepeatOptions} from "../../shared/ScheduleRepeatOptions";
import {DatabaseManager} from "./database/DatabaseManager";
import {Schedule} from "./database/dataClasses/Schedule";
import {column} from "./database/column";
import {ChooseDonationMessageAction} from "./network/messageActions/ChooseDonationMessageAction";

interface ScheduleEntry extends ScheduleRepeatOptions {
	nextRun: number
	callback: () => void,
}

const oneDay = 1000 * 60 * 60 * 24

export class DailyScheduleManager {
	private scheduleEntries: ScheduleEntry[] = [];
	private readonly db: DatabaseManager
	
	constructor(db: DatabaseManager) {
		this.db = db
		this.scheduleLoop()
	}
	
	private scheduleLoop(): void {
		const date = new Date()
		const now = date.getTime()
		date.setHours(24, 0, 0, 0)
		const midnight = date.getTime()
		
		setTimeout(this.loop.bind(this), midnight - now)
	}
	
	public loop(): void {
		const now = Date.now()
		const schedules = this.db.tableSelect(Schedule, `${column(Schedule, "enabled")} = 1 AND ${column(Schedule, "nextLoop")} <= ${now}`)
		console.log(`Found ${schedules.length} Schedules that will run now`)
		
		for(const schedule of schedules) {
			ChooseDonationMessageAction.saveChoice(this.db, schedule.userId)
			
			const newTimestamp = this.considerOptions(schedule, now)
			this.db.update(Schedule, { "=": { nextLoop: newTimestamp } }, `${column(Schedule, "scheduleId")} = ${schedule.scheduleId}`)
		}
		
		for(const entry of this.scheduleEntries) {
			if(entry.nextRun <= now) {
				entry.callback()
				entry.nextRun = this.considerOptions(entry, now)
			}
		}
		
		this.scheduleLoop()
	}
	
	private considerOptions(options: ScheduleRepeatOptions, timestamp: number): number {
		timestamp += oneDay * options.repeatDays
		
		if(options.fixedDayOfMonth) {
			const date = new Date(timestamp)
			date.setDate(options.fixedDayOfMonth)
			if(date.getTime() < timestamp)
				date.setMonth(date.getMonth() + 1, options.fixedDayOfMonth)
			
			timestamp = date.getTime()
			
		}
		return timestamp
	}
	
	public addSchedule(options: ScheduleRepeatOptions, callback: () => void): void {
		this.scheduleEntries.push({
			callback: callback,
			nextRun: this.considerOptions(options, Date.now()),
			...options
		})
	}
}
