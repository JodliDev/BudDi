import { BasePage } from "../BasePage";
import m, { Vnode } from "mithril";
import { LoadingSpinner } from "../../widgets/LoadingSpinner";
import {RegisterMessage} from "../../../../shared/messages/RegisterMessage";
import {ReasonedConfirmResponseMessage} from "../../../../shared/messages/ReasonedConfirmResponseMessage";
import {PASSWORD_MIN_LENGTH, USERNAME_MIN_LENGTH} from "../../Constants";
import {Lang} from "../../../../shared/Lang";

export class Register extends BasePage {
	private isLoading: boolean = false;
	private formIsValid: boolean = false;
	private error: string = "";
	
	private async onSubmit(e: SubmitEvent): Promise<void> {
		this.isLoading = true
		m.redraw()
		e.preventDefault()
		
		const formData = new FormData(e.target as HTMLFormElement)
		
		const username = formData.get("username")?.toString() ?? "";
		const password = formData.get("password")?.toString() ?? "";
		
		const message = new RegisterMessage(username, password)
		
        const response = await this.site.socket.sendAndReceive(message) as ReasonedConfirmResponseMessage
		if(!response.success) {
			this.site.errorManager.error(response.reason)
		}
		else
			this.site.goto("Login")
		
		this.isLoading = false
		m.redraw()
	}
	
	private validateForm() {
		const form = document.querySelector("form[name='registerForm']") as HTMLFormElement
		const username = (form.username as HTMLInputElement).value
		const password = (form.password as HTMLInputElement).value
        const passwordRepeat = (form.passwordRepeat as HTMLInputElement).value
		
        this.formIsValid = username.length >= USERNAME_MIN_LENGTH
			&& password.length >= PASSWORD_MIN_LENGTH
			&& password == passwordRepeat
		m.redraw()
	}
	
	public getView(): Vnode {
		return <div class="vertical hAlignCenter vAlignCenter">
			<form name="registerForm" onsubmit={ this.onSubmit.bind(this) } class="surface vertical">
				
				<label>
					<small>{Lang.get("username")}</small>
					<input type="text" name="username" onkeyup={this.validateForm.bind(this)}/>
				</label>
				<label>
					<small>{Lang.get("password")}</small>
					<input type="password" name="password"/>
				</label>
				<label>
					<small>{Lang.get("passwordRepeated")}</small>
					<input type="password" name="passwordRepeat" onkeyup={this.validateForm.bind(this)}/>
				</label>
				<div class="entry horizontal vAlignCenter fullLine">
					<div class="fillSpace"></div>
					{ LoadingSpinner(this.isLoading) }
					<input type="submit" value={Lang.get("register")} disabled={ this.isLoading || !this.formIsValid }/>
				</div>
			</form>
		</div>
	}
}
