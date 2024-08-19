import {DatabaseManager} from "./database/DatabaseManager";
import {DatabaseInstructions} from "./database/DatabaseInstructions";
import {WebSocketHelper} from "./network/WebSocketHelper";
import express from 'express';
import {Lang} from "../../shared/Lang";
import {Options} from "./Options";
import {DailyScheduleManager} from "./DailyScheduleManager";
import {LoginSession} from "./database/dataClasses/LoginSession";
import {column} from "./database/column";

const LOGIN_SESSION_MAX_AGE = 1000 * 60 * 60 * 24 * 90

const options = new Options()
console.log(options)
console.log("Backend is starting...")
Lang.init(options.lang).then(
	() => {
		console.log(`Server language is ${options.lang}`)
	}
)

DatabaseManager.access(new DatabaseInstructions(), options)
	.then((dbManager) => {
		const webSocket = new WebSocketHelper(
			options,
			async (message, session) => {
				await message.exec(session, dbManager)
			}
		)
		
		const scheduler = new DailyScheduleManager(dbManager)
		
		scheduler.addSchedule({ repeatDays: 1 }, () => {
			const oldestLoginSession = Date.now() - LOGIN_SESSION_MAX_AGE
			dbManager.delete(LoginSession, `${column(LoginSession, "lastUpdate")} < ${oldestLoginSession}`)
		})
		
		
		const webServer = express()
		webServer.use(options.pathHttp, express.static(options.frontend))
		
		
		webServer.listen(options.portHttp, () =>
			console.log(`WebServer is listening on http://localhost:${options.portHttp}${options.pathHttp}`)
		);
		
	})
