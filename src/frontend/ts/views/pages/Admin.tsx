import m, {Vnode} from "mithril";
import {Lang} from "../../../../shared/Lang";
import {PubUser} from "../../../../shared/public/PubUser";
import ListEntries from "../structures/ListEntries";
import bindValueToInput from "../structures/bindValueToInput";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {SetServerSettingsMessage} from "../../../../shared/messages/SetServerSettingsMessage";
import FeedbackIcon, {FeedbackCallBack} from "../structures/FeedbackIcon";
import {LoggedInBasePage} from "../LoggedInBasePage";

export class Admin extends LoggedInBasePage {
	private feedback = new FeedbackCallBack()
	
	private async setRegistrationAllowed(value: boolean) {
		this.site.serverSettings.registrationAllowed = value
		this.feedback.setLoading(true)
		m.redraw()
		
		const response: ConfirmResponseMessage = await this.site.socket.sendAndReceive(new SetServerSettingsMessage(this.site.serverSettings))
		
		this.feedback.setSuccess(response.success)
		this.feedback.setLoading(false)
		m.redraw()
	}
	
	getView(): Vnode {
		return <div class="vertical hAlignCenter">
			<ListEntries<PubUser>
				title={Lang.get("user")}
				tableClass={PubUser} 
				site={this.site}
				deleteOptions={{}}
				getEntryView={entry =>
					<div class="fillSpace">{entry.item.username}</div>}
			/>
			<div class="surface horizontal vAlignCenter">
				<label class="fillSpace">
					<small>{Lang.get("enableRegistration")}</small>
					<input type="checkbox" disabled={!this.feedback.isReady()} {...bindValueToInput(this.site.serverSettings.registrationAllowed, this.setRegistrationAllowed.bind(this))}/>
				</label>
				<FeedbackIcon callback={this.feedback} reserveSpace={true}/>
			</div>
		</div>;
	}
}
