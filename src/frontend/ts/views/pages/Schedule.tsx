import { BasePage } from "../BasePage";
import m, { Vnode } from "mithril";
import {Lang} from "../../../../shared/Lang";
import {ScheduleRepeatOptions} from "../../../../shared/ScheduleRepeatOptions";
import {ListMessage} from "../../../../shared/messages/ListMessage";
import {PubSchedule} from "../../../../shared/public/PubSchedule";
import {ListResponseMessage} from "../../../../shared/messages/ListResponseMessage";
import {BindValueToInput} from "../../widgets/BindValueToInput";
import {LoadingSpinner} from "../../widgets/LoadingSpinner";
import {DeleteMessage} from "../../../../shared/messages/DeleteMessage";
import {EditMessage} from "../../../../shared/messages/EditMessage";
import {AddMessage} from "../../../../shared/messages/AddMessage";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {ListEntryResponseMessage} from "../../../../shared/messages/ListEntryResponseMessage";

export class Schedule extends BasePage {
	private scheduleEnabled: boolean = false
	private schedule: PubSchedule = new PubSchedule()
	private isLoading: boolean = false
	
	
	private async saveSchedule() {
		this.isLoading = true
		m.redraw()
		
		const scheduleExists = this.schedule.scheduleId != 0
		const response = await this.site.socket.sendAndReceive(
			scheduleExists
				? new EditMessage(PubSchedule, this.schedule.scheduleId, this.schedule)
				: new AddMessage(PubSchedule, this.schedule)
		) as ListEntryResponseMessage<PubSchedule>
		
		if(!response.success)
			this.site.errorManager.error(Lang.get("errorUnknown"))
		else
			this.schedule = response.entry.item
		this.isLoading = false
		m.redraw()
	}
	
	private async saveScheduleActivation() {
		if(this.schedule.scheduleId == 0)
			return
		
		this.isLoading = true
		m.redraw()
		
		const data: Partial<PubSchedule> = { enabled: this.scheduleEnabled }
		const response: ConfirmResponseMessage = await this.site.socket.sendAndReceive(new EditMessage(PubSchedule, this.schedule.scheduleId, data))
		
		if(!response.success)
			this.site.errorManager.error(Lang.get("errorUnknown"))
		this.isLoading = false
		m.redraw()
	}
	
	async load(): Promise<void> {
		await super.load()
			
		const response = await this.site.socket.sendAndReceive(
			new ListMessage(PubSchedule, 0, 1)
		) as ListResponseMessage<PubSchedule>
		
		if(response.success && response.list.length != 0) {
			this.scheduleEnabled = true
			this.schedule = response.list[0].item
		}
	}
	
	getView(): Vnode {
		const schedule = this.schedule
		return <div class="vertical hAlignCenter">
			<label class="surface">
				<small>{Lang.get("enableSchedule")}</small>
				<input type="checkbox" disabled={this.isLoading} { ...BindValueToInput(() => this.scheduleEnabled, async value => {
					this.scheduleEnabled = value
					await this.saveScheduleActivation()
				}) }/>
			</label>
			{ LoadingSpinner(this.isLoading) }
			{ !this.isLoading && this.scheduleEnabled &&
				<form class="surface vertical vAlignStart" onsubmit={this.saveSchedule.bind(this)}>
					
					<label class="subSurface">
						<small>{Lang.get("daysBetween")}</small>
						<input type="number" min="1"
							   max="31" {...BindValueToInput(() => schedule.repeatDays, value => schedule.repeatDays = value)}/>
						<small>{Lang.get("minimalNumberOfDaysBetweenRepeats")}</small>
					</label>
					
					<label class="subSurface">
						<small>{Lang.get("atSpecificDayOfMonth")}</small>
						<input
							type="checkbox" {...BindValueToInput(() => schedule.fixedDayOfMonth != 0, value => schedule.fixedDayOfMonth = value ? 1 : 0)}/>
					</label>
					
					{schedule.fixedDayOfMonth != 0 &&
						<label class="subSurface">
							<small>{Lang.get("dayOfMonth")}</small>
							<input type="number" min="1"
								   max="31" {...BindValueToInput(() => schedule.fixedDayOfMonth, value => schedule.fixedDayOfMonth = value)}/>
						</label>
					}
					
					<input type="submit" value={Lang.get("save")}/>
				</form>
			}
		</div>;
	}
}
