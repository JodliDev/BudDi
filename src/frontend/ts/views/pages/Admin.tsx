import m, {Vnode} from "mithril";
import {Lang} from "../../../../shared/Lang";
import {PubUser} from "../../../../shared/public/PubUser";
import {ListWidget} from "../../widgets/ListWidget";
import {BindValueToInput} from "../../widgets/BindValueToInput";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {SetServerSettingsMessage} from "../../../../shared/messages/SetServerSettingsMessage";
import {FeedbackCallBack, FeedbackIcon} from "../../widgets/FeedbackIcon";
import {LoggedInBasePage} from "../LoggedInBasePage";

export class Admin extends LoggedInBasePage {
	private feedback = new FeedbackCallBack()
	
	private async setRegistrationAllowed(value: boolean) {
		this.site.serverSettings.registrationAllowed = value
		this.feedback.loading(true)
		m.redraw()
		
		const response: ConfirmResponseMessage = await this.site.socket.sendAndReceive(new SetServerSettingsMessage(this.site.serverSettings))
		
		this.feedback.feedback(response.success)
		this.feedback.loading(false)
		m.redraw()
	}
	
	getView(): Vnode {
		return <div class="vertical hAlignCenter">
			{
				ListWidget({
					title: Lang.get("user"),
					tableClass: PubUser,
					site: this.site,
					deleteOptions: {},
					getEntryView: entry => <div class="fillSpace">
						{entry.item.username}
					</div>
				})
			}
			<div class="surface horizontal vAlignCenter">
				<label class="fillSpace">
					<small>{Lang.get("enableRegistration")}</small>
					<input type="checkbox" disabled={!this.feedback.isReady()} {...BindValueToInput(() => this.site.serverSettings.registrationAllowed, this.setRegistrationAllowed.bind(this))}/>
				</label>
				{FeedbackIcon(this.feedback, true)}
			</div>
		</div>;
	}
}
