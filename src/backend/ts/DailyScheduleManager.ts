import {ScheduleRepeatOptions} from "../../shared/ScheduleRepeatOptions";

interface ScheduleEntry extends ScheduleRepeatOptions {
	nextRun: number
	callback: () => void,
}

const oneDay = 1000 * 60 * 60 * 24

export class DailyScheduleManager {
	private scheduleEntries: ScheduleEntry[] = [];
	
	constructor() {
		this.scheduleLoop()
	}
	
	private scheduleLoop(): void {
		const date = new Date()
		const now = date.getTime()
		date.setHours(24, 30, 0, 0)
		const midnight = date.getTime()
		const loopMs = midnight - now
		
		console.log(`Next schedule loop will run in ${Math.floor(loopMs / 1000 / 60)} min`)
		setTimeout(this.loop.bind(this), loopMs)
	}
	
	public loop(): void {
		const now = Date.now()
		
		for(const entry of this.scheduleEntries) {
			if(entry.nextRun <= now) {
				entry.callback()
				entry.nextRun = DailyScheduleManager.considerOptions(entry, now)
			}
		}
		
		this.scheduleLoop()
	}
	
	public static considerOptions(options: ScheduleRepeatOptions, timestamp: number): number {
		timestamp += oneDay * options.repeatDays
		const date = new Date(timestamp)
		date.setHours(0, 0, 0, 0)
		
		if(options.fixedDayOfMonth) {
			date.setDate(options.fixedDayOfMonth)
			if(date.getTime() < timestamp)
				date.setMonth(date.getMonth() + 1, options.fixedDayOfMonth)
		}
		timestamp = date.getTime()
		return timestamp
	}
	
	public addSchedule(options: ScheduleRepeatOptions, callback: () => void): void {
		this.scheduleEntries.push({
			callback: callback,
			nextRun: DailyScheduleManager.considerOptions(options, Date.now()),
			...options
		})
	}
}
