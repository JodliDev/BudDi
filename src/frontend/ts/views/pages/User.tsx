import m, { Vnode } from "mithril";
import {Lang} from "../../../../shared/Lang";
import {BindValueToInput} from "../../widgets/BindValueToInput";
import {LoadingSpinner} from "../../widgets/LoadingSpinner";
import {ChangePasswordMessage} from "../../../../shared/messages/ChangePasswordMessage";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {FeedbackCallBack, FeedbackIcon} from "../../widgets/FeedbackIcon";
import {PASSWORD_MIN_LENGTH} from "../../Constants";
import {DeleteAccountMessage} from "../../../../shared/messages/DeleteAccountMessage";
import {ListMessage} from "../../../../shared/messages/ListMessage";
import {DonationAmountType, PubUser} from "../../../../shared/public/PubUser";
import {ListResponseMessage} from "../../../../shared/messages/ListResponseMessage";
import {EditMessage} from "../../../../shared/messages/EditMessage";
import {LoggedInBasePage} from "../LoggedInBasePage";

export class User extends LoggedInBasePage {
	private user = new PubUser()
	private settingsSaving: boolean = false
	private settingsFeedback: FeedbackCallBack = {}
	private passwordSaving: boolean = false
	private passwordFeedback: FeedbackCallBack = {}
	private newPassword: string = ""
	private newPasswordRepeat: string = ""
	private confirmDeleteAccount: boolean = false
	
	
	private async saveUserSettings(e: SubmitEvent) {
		e.preventDefault()
		this.settingsSaving = true
		m.redraw()
		
		const response = await this.site.socket.sendAndReceive(
			new EditMessage(PubUser, this.site.userId, this.user)
		) as ConfirmResponseMessage
		
		if(!response.success)
			this.site.errorManager.error(Lang.get("errorUnknown"))
		
		this.settingsFeedback.feedback!(response.success)
		this.settingsSaving = false
		m.redraw()
	}
	
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
		const response = await this.site.socket.sendAndReceive(
			new ListMessage(PubUser, 0, 1)
		) as ListResponseMessage<PubUser>
		
		if(response.success && response.list.length != 0)
			this.user = response.list[0].item
	}
	
	getView(): Vnode {
		return <div class="vertical hAlignCenter">
			<form class="surface vertical vAlignStart" onsubmit={this.saveUserSettings.bind(this)}>
				<h3>{ Lang.get("settings") }</h3>
				
				<label>
					<small>{ Lang.get("currency") }</small>
					<input type="text" {...BindValueToInput(() => this.user.currency, value => this.user.currency = value)}/>
				</label>
				
				<label>
					<small>{ Lang.get("donationAmount") }</small>
					<input type="number" {...BindValueToInput(() => this.user.donationAmount, value => this.user.donationAmount = value)}/>
				</label>
				
				<label>
					<small>{ Lang.get("donationCalculation") }</small>
					<select {...BindValueToInput(() => this.user.donationAmountType, value => this.user.donationAmountType = value)}>
						<option value={DonationAmountType.PerEntry}>{Lang.get("perEntry")}</option>
						<option value={DonationAmountType.Fixed}>{Lang.get("fixed")}</option>
					</select>
					<small>{ Lang.get("infoDonationCalculation") }</small>
				</label>
				
				<label>
					<small>{ Lang.get("username") }</small>
					<input type="text" {...BindValueToInput(() => this.user.username, value => this.user.username = value)}/>
				</label>
				
				
				<div class="horizontal hAlignEnd vAlignCenter">
					{ LoadingSpinner(this.settingsSaving, true) }
					{ FeedbackIcon(this.settingsFeedback, true) }
					<input type="submit" value={Lang.get("save")} disabled={this.settingsSaving}/>
				</div>
			</form>
			<form class="surface vertical vAlignStart" onsubmit={this.changePassword.bind(this)}>
				<h3>{ Lang.get("changePassword") }</h3>
				
				<label>
					<small>{ Lang.get("newPassword") }</small>
					<input type="text" {...BindValueToInput(() => this.newPassword, value => this.newPassword = value)}/>
				</label>
				<label>
					<small>{ Lang.get("passwordRepeated") }</small>
					<input type="text" {...BindValueToInput(() => this.newPasswordRepeat, value => this.newPasswordRepeat = value)}/>
				</label>
				
				<div class="horizontal hAlignEnd vAlignCenter">
					{ LoadingSpinner(this.passwordSaving, true) }
					{ FeedbackIcon(this.passwordFeedback, true) }
					<input type="submit" value={Lang.get("change")} disabled={this.newPassword.length < PASSWORD_MIN_LENGTH || this.newPassword != this.newPasswordRepeat || this.passwordSaving}/>
				</div>
			</form>
			<form class="surface horizontal">
				<input type="checkbox" { ...BindValueToInput(() => this.confirmDeleteAccount, value => this.confirmDeleteAccount = value) }/>
				<input type="button" class="warn" value={Lang.get("deleteAccount")} onclick={this.deleteAccount.bind(this)} disabled={ !this.confirmDeleteAccount }/>
			</form>
		</div>;
	}
}
