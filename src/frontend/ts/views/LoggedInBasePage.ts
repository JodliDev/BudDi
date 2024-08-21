import {BasePage} from "./BasePage";

export abstract class LoggedInBasePage extends BasePage {
	async load(): Promise<void> {
		await super.load()
		await this.site.waitForLogin
	}
}
