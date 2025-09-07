import m, {Vnode} from "mithril";
import {Lang} from "../../../../shared/Lang";
import bindValueToInput from "../structures/bindValueToInput";
import {ChangePasswordMessage} from "../../../../shared/messages/ChangePasswordMessage";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import FeedbackIcon, {FeedbackCallBack} from "../structures/FeedbackIcon";
import {PASSWORD_MIN_LENGTH} from "../../Constants";
import {DeleteAccountMessage} from "../../../../shared/messages/DeleteAccountMessage";
import {PubUser} from "../../../../shared/public/PubUser";
import {LoggedInBasePage} from "../LoggedInBasePage";
import EditEntry from "../structures/EditEntry";
import {ListResponseEntry} from "../../../../shared/messages/ListResponseMessage";

export class User extends LoggedInBasePage {
	private user = new PubUser()
	private passwordFeedback = new FeedbackCallBack()
	private newPassword: string = ""
	private newPasswordRepeat: string = ""
	private confirmDeleteAccount: boolean = false
	
	private async changePassword(e: SubmitEvent) {
		e.preventDefault()
		this.passwordFeedback.setLoading(true)
		m.redraw()
		
		const response = await this.site.socket.sendAndReceive(new ChangePasswordMessage(this.newPassword)) as ConfirmResponseMessage
		
		this.passwordFeedback.setSuccess(response.success)
		this.newPassword = ""
		this.newPasswordRepeat = ""
		this.passwordFeedback.setLoading(false)
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
				
				<EditEntry<PubUser>
					mode="edit"
					site={this.site}
					editId={this.user.userId}
					defaults={this.user}
					tableClass={PubUser}
					columns={["currency", "username"]}
					onFinish={(entry: ListResponseEntry<PubUser>) => 
						this.site.loginState.setLoginData(entry.item.username, entry.item.currency)
					}
				/>
			</div>
			<form class="surface vertical vAlignStart" onsubmit={this.changePassword.bind(this)}>
				<h3>{Lang.get("changePassword")}</h3>
				
				<label>
					<small>{Lang.get("newPassword")}</small>
					<input type="text" {...bindValueToInput(this.newPassword, value => this.newPassword = value)}/>
				</label>
				<label>
					<small>{Lang.get("passwordRepeated")}</small>
					<input type="text" {...bindValueToInput(this.newPasswordRepeat, value => this.newPasswordRepeat = value)}/>
				</label>
				
				<div class="horizontal hAlignEnd vAlignCenter">
					<FeedbackIcon callback={this.passwordFeedback} reserveSpace={true}/>
					<input type="submit" value={Lang.get("change")}
						   disabled={this.newPassword.length < PASSWORD_MIN_LENGTH || this.newPassword != this.newPasswordRepeat || !this.passwordFeedback.isReady()}/>
				</div>
			</form>
			<form class="surface horizontal">
				<input type="checkbox" {...bindValueToInput(this.confirmDeleteAccount, value => this.confirmDeleteAccount = value)}/>
				<input type="button" class="warn" value={Lang.get("deleteAccount")} onclick={this.deleteAccount.bind(this)}
					   disabled={!this.confirmDeleteAccount}/>
			</form>
		</div>;
	}
}
