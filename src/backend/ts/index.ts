import {DatabaseManager} from "./database/DatabaseManager";
import {DatabaseInstructions} from "./database/DatabaseInstructions";
import {WebSocketHelper} from "./network/WebSocketHelper";
import express from 'express';
import {Options, PublicOptions} from "./Options";
import {DailyScheduleManager} from "./DailyScheduleManager";
import {LoginSession} from "./database/dataClasses/LoginSession";
import {writeFileSync} from "node:fs";
import {Schedule} from "./database/dataClasses/Schedule";
import {ChooseForPaymentMessageAction} from "./network/messageActions/ChooseForPaymentMessageAction";
import {SqlWhere} from "./database/SqlWhere";

const LOGIN_SESSION_MAX_AGE = 1000 * 60 * 60 * 24 * 90

const options = new Options()
console.log(options)
console.log("Backend is starting...")

const optionsFile = `${options.root}/${options.frontend}/options.js`
console.log(`Write options to ${optionsFile}`)
writeFileSync(optionsFile, JSON.stringify(new PublicOptions(options)), {encoding: 'utf-8'})

DatabaseManager.access(new DatabaseInstructions(), options)
	.then((dbManager) => {
		const scheduler = new DailyScheduleManager()
		
		scheduler.addSchedule({repeatDays: 1}, () => {
			const oldestLoginSession = Date.now() - LOGIN_SESSION_MAX_AGE
			dbManager.delete(LoginSession, SqlWhere(LoginSession).is("lastLogin", oldestLoginSession))
		})
		
		scheduler.addSchedule({repeatDays: 1}, () => {
			const now = Date.now()
			const schedules = dbManager.selectTable(Schedule, {where: SqlWhere(Schedule).is("enabled", "1").and().isCompared("<=", "nextLoop", now)})
			console.log(`Found ${schedules.length} Schedules that will run now`)
			
			for(const schedule of schedules) {
				for(let i = schedule.count; i > 0; --i) {
					ChooseForPaymentMessageAction.addNewChoice(dbManager, schedule.userId, schedule.amount)
				}
				
				const newTimestamp = DailyScheduleManager.considerOptions(schedule, now)
				dbManager.update(
					Schedule,
					{"=": {nextLoop: newTimestamp, lastLoop: now}},
					SqlWhere(Schedule).is("scheduleId", schedule.scheduleId)
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
