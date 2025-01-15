import {DatabaseManager} from "./database/DatabaseManager";
import {DatabaseInstructions} from "./database/DatabaseInstructions";
import {WebSocketHelper} from "./network/WebSocketHelper";
import express from 'express';
import {Options, PublicOptions} from "./Options";
import {DailyScheduleManager} from "./DailyScheduleManager";
import {LoginSession} from "./database/dataClasses/LoginSession";
import {column} from "./database/column";
import {writeFileSync} from "node:fs";
import {Schedule} from "./database/dataClasses/Schedule";
import {ChooseForSpendingMessageAction} from "./network/messageActions/ChooseForSpendingMessageAction";

const LOGIN_SESSION_MAX_AGE = 1000 * 60 * 60 * 24 * 90

const options = new Options()
console.log(options)
console.log("Backend is starting...")

const optionsFile = `${options.root}/${options.frontend}/options.js`
console.log(`Write options to ${optionsFile}`)
writeFileSync(optionsFile, JSON.stringify(new PublicOptions(options)), { encoding: 'utf-8' })

DatabaseManager.access(new DatabaseInstructions(), options)
	.then((dbManager) => {
		const scheduler = new DailyScheduleManager(dbManager)
		
		scheduler.addSchedule({ repeatDays: 1 }, () => {
			const oldestLoginSession = Date.now() - LOGIN_SESSION_MAX_AGE
			dbManager.delete(LoginSession, `${column(LoginSession, "lastLogin")} < ${oldestLoginSession}`)
		})
		
		scheduler.addSchedule({ repeatDays: 1 }, () => {
			const now = Date.now()
			const schedules = dbManager.selectTable(Schedule, `${column(Schedule, "enabled")} = 1 AND ${column(Schedule, "nextLoop")} <= ${now}`)
			console.log(`Found ${schedules.length} Schedules that will run now`)
			
			for(const schedule of schedules) {
				for(let i = schedule.spendingCount; i > 0; --i) {
					ChooseForSpendingMessageAction.addNewChoice(dbManager, schedule.userId, schedule.spendingAmount)
				}
				
				const newTimestamp = DailyScheduleManager.considerOptions(schedule, now)
				dbManager.update(
					Schedule,
					{ "=": { nextLoop: newTimestamp, lastLoop: now } },
					`${column(Schedule, "scheduleId")} = ${schedule.scheduleId}`
				)
			}
		})
		
		
		const webServer = express()
		webServer.use(options.pathHttp, express.static(`${options.root}/${options.frontend}`))
		
		
		const httpServer = webServer.listen(options.portHttp, () =>
			console.log(`WebServer is listening on http://localhost:${options.portHttp}${options.pathHttp}`)
		);
		
		
		const webSocket = new WebSocketHelper(
			options,
			httpServer,
			async (message, session) => {
				await message.exec(session, dbManager)
			}
		)
	})
