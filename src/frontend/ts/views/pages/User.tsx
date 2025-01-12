import m, { Vnode } from "mithril";
import {Lang} from "../../../../shared/Lang";
import {BindValueToInput} from "../../widgets/BindValueToInput";
import {LoadingSpinner} from "../../widgets/LoadingSpinner";
import {ChangePasswordMessage} from "../../../../shared/messages/ChangePasswordMessage";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {FeedbackCallBack, FeedbackIcon} from "../../widgets/FeedbackIcon";
import {PASSWORD_MIN_LENGTH} from "../../Constants";
import {DeleteAccountMessage} from "../../../../shared/messages/DeleteAccountMessage";
import {PubUser} from "../../../../shared/public/PubUser";
import {LoggedInBasePage} from "../LoggedInBasePage";
import {ListEntryEditWidget} from "../../widgets/ListEntryEditWidget";

export class User extends LoggedInBasePage {
	private user = new PubUser()
	private passwordSaving: boolean = false
	private passwordFeedback: FeedbackCallBack = {}
	private newPassword: string = ""
	private newPasswordRepeat: string = ""
	private confirmDeleteAccount: boolean = false
	
	private async changePassword(e: SubmitEvent) {
		e.preventDefault()
		this.passwordSaving = true
		m.redraw()
		
		const response = await this.site.socket.sendAndReceive(
			new ChangePasswordMessage(this.newPassword)
		) as ConfirmResponseMessage
		
		if(!response.success)
			this.site.errorManager.error(Lang.get("errorUnknown"))
		
		this.passwordFeedback.feedback!(response.success)
		this.newPassword = ""
		this.newPasswordRepeat = ""
		this.passwordSaving = false
		m.redraw()
	}
	
	private async deleteAccount() {
		if(!confirm(Lang.get("confirmAccountDelete")))
			return
		
		const response = await this.site.socket.sendAndReceive(
			new DeleteAccountMessage()
		) as ConfirmResponseMessage
		
		if(!response.success)
			this.site.errorManager.error(Lang.get("errorUnknown"))
		else
			this.site.logout()
	}
	
	
	async load(): Promise<void> {
		await super.load();
		this.user = await this.site.socket.getSingleEntry(PubUser) ?? new PubUser()
	}
	
	getView(): Vnode {
		return <div class="vertical hAlignCenter">
			
			<div class="surface vertical vAlignStart">
				<h3>{Lang.get("settings")}</h3>
				
				{ListEntryEditWidget<PubUser>({
					mode: "edit",
					site: this.site,
					editId: this.user.userId,
					defaults: this.user,
					tableClass: PubUser,
					columns: ["currency", "username"]
				})}
			</div>
			<form class="surface vertical vAlignStart" onsubmit={this.changePassword.bind(this)}>
				<h3>{Lang.get("changePassword")}</h3>
				
				<label>
					<small>{Lang.get("newPassword")}</small>
					<input type="text" {...BindValueToInput(() => this.newPassword, value => this.newPassword = value)}/>
				</label>
				<label>
					<small>{Lang.get("passwordRepeated")}</small>
					<input type="text" {...BindValueToInput(() => this.newPasswordRepeat, value => this.newPasswordRepeat = value)}/>
				</label>
				
				<div class="horizontal hAlignEnd vAlignCenter">
					{LoadingSpinner(this.passwordSaving, true)}
					{FeedbackIcon(this.passwordFeedback, true)}
					<input type="submit" value={Lang.get("change")}
						   disabled={this.newPassword.length < PASSWORD_MIN_LENGTH || this.newPassword != this.newPasswordRepeat || this.passwordSaving}/>
				</div>
			</form>
			<form class="surface horizontal">
				<input type="checkbox" {...BindValueToInput(() => this.confirmDeleteAccount, value => this.confirmDeleteAccount = value)}/>
				<input type="button" class="warn" value={Lang.get("deleteAccount")} onclick={this.deleteAccount.bind(this)}
					   disabled={!this.confirmDeleteAccount}/>
			</form>
		</div>;
	}
}
