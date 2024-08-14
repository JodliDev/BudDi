import {DatabaseManager} from "./database/DatabaseManager";
import {DatabaseInstructions} from "./database/DatabaseInstructions";
import {WebSocketHelper} from "./network/WebSocketHelper";
import express from 'express';
import {Lang} from "../../shared/Lang";
import {Options} from "./Options";

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
		
		
		const webServer = express()
		webServer.use(options.pathHttp, express.static(options.frontend))
		
		
		webServer.listen(options.portHttp, () =>
			console.log(`WebServer is listening on http://localhost:${options.portHttp}${options.pathHttp}`)
		);
		
	})
