import { Site } from "./views/Site";
import { Lang } from "../../shared/Lang";
import {IPublicOptions} from "../../shared/IPublicOptions";

async function init() {
	const response = await fetch("options.js")
	const options = await response.json() as IPublicOptions
	
	await Lang.init(options.lang);
	document.title = `${Lang.get("appName")} - ${Lang.get("appTitle")}`
	const site = new Site(options)
}
init()
	.then();
