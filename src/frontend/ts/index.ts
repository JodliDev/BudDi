import { Site } from "./views/Site";
import { Lang } from "../../shared/Lang";
import {IPublicOptions} from "../../shared/IPublicOptions";

async function init() {
	await Lang.init("en")
	const response = await fetch("options.js")
	const options = await response.json() as IPublicOptions
	const site = new Site(options)
}
init()
	.then();
