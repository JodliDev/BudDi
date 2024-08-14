import { Site } from "./views/Site";
import { Lang } from "../../shared/Lang";

async function init() {
	await Lang.init("en")
	const site = new Site()
}
init()
	.then();
