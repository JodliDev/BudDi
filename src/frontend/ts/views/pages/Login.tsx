import { BasePage } from "../BasePage";
import m, { Vnode } from "mithril";
import { LoadingSpinner } from "../../widgets/LoadingSpinner";
import { Lang } from "../../../../shared/Lang";
import {LoginMessage} from "../../../../shared/messages/LoginMessage";
import {LoginResponseMessage} from "../../../../shared/messages/LoginResponseMessage";

export class Login extends BasePage {
	private isLoading: boolean = false;
	
	private async onSubmit(e: SubmitEvent): Promise<void> {
		this.isLoading = true
		
		m.redraw()
		e.preventDefault()
		const formData = new FormData(e.target as HTMLFormElement)
		
		const username = formData.get("username")?.toString() ?? "";
		const password = formData.get("password")?.toString() ?? "";
		const loginMessage = new LoginMessage(username, password)
		
        const response = await this.site.socket.sendAndReceive(loginMessage) as LoginResponseMessage
		if(!response.success) {
			this.site.errorManager.error(Lang.get("errorLoginFailed"))
			this.isLoading = false
			m.redraw()
		}
		else {
			this.site.login(response.userId ?? 0, response.sessionHash ?? "")
			this.site.goto("Dashboard")
		}
	}
	
	public getView(): Vnode {
		return <div class="vertical hAlignCenter vAlignCenter">
			<form onsubmit={ this.onSubmit.bind(this) } class="surface vertical">
				
				<label>
					<small>Username:</small>
					<input type="text" name="username"/>
				</label>
				<label>
					<small>Password:</small>
					<input type="password" name="password"/>
				</label>
				<div class="entry horizontal vAlignCenter fullLine">
					<div class="fillSpace"></div>
					{ LoadingSpinner(this.isLoading) }
					<input type="submit" value={Lang.get("login")} disabled={ this.isLoading }/>
				</div>
			</form>
		</div>
	}
}
