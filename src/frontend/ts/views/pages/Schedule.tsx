import m, { Vnode } from "mithril";
import {Lang} from "../../../../shared/Lang";
import {ListMessage} from "../../../../shared/messages/ListMessage";
import {PubSchedule} from "../../../../shared/public/PubSchedule";
import {ListResponseMessage} from "../../../../shared/messages/ListResponseMessage";
import {BindValueToInput} from "../../widgets/BindValueToInput";
import {EditMessage} from "../../../../shared/messages/EditMessage";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {LoggedInBasePage} from "../LoggedInBasePage";
import {ListEntryEditWidget} from "../../widgets/ListEntryEditWidget";
import {PubUser} from "../../../../shared/public/PubUser";

export class Schedule extends LoggedInBasePage {
	private scheduleEnabled: boolean = false
	private schedule: PubSchedule = new PubSchedule()
	private isLoading: boolean = false
	
	private async saveScheduleActivation() {
		if(this.schedule.scheduleId == 0)
			return
		
		this.isLoading = true
		m.redraw()
		
		const data: Partial<PubSchedule> = { enabled: this.scheduleEnabled }
		await this.site.socket.sendAndReceive(new EditMessage(PubSchedule, this.schedule.scheduleId, data))
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
		
		
		const schedule = await this.site.socket.getSingleEntry(PubSchedule)
		if(schedule) {
			this.scheduleEnabled = true
			this.schedule = schedule
		}
	}
	
	getView(): Vnode {
		const schedule = this.schedule
		return <div class="vertical hAlignCenter">
			
			<div class="surface vertical vAlignStart">
				<h3>{Lang.get("schedule")}</h3>
				<label>
					<div class="horizontal">
						<input type="checkbox" disabled={this.isLoading} {...BindValueToInput(() => this.scheduleEnabled, async value => {
							this.scheduleEnabled = value
							await this.saveScheduleActivation()
						})}/>
						<span>{Lang.get("enableSchedule")}</span>
					</div>
				</label>
				{this.scheduleEnabled &&
					<div class="vertical vAlignStart">
						<div class="horizontal">
							{schedule.lastLoop != 0 &&
								<div class="labelLike">
									<small>{Lang.get("lastScheduleLoop")}</small>
									<span class="subSurface">{(new Date(schedule.lastLoop)).toLocaleDateString()}</span>
								</div>
							}
							{schedule.nextLoop != 0 &&
								<div class="labelLike">
									<small>{Lang.get("nextScheduleLoop")}</small>
									<span class="subSurface">{(new Date(schedule.nextLoop)).toLocaleDateString()}</span>
								</div>
							}
						</div>
						
						
						
						{ListEntryEditWidget<PubSchedule>({
							mode: "edit",
							site: this.site,
							editId: this.schedule.scheduleId,
							defaults: this.schedule,
							tableClass: PubSchedule,
							columns: ["amount", "count", "fixedDayOfMonth", "repeatDays"],
							onFinish: newSchedule => {this.schedule = newSchedule.item},
							customInputView: (key, value, setValue) => {
								switch(key) {
									case "fixedDayOfMonth":
										return <label>
											<small>{Lang.get("dayOfMonth")}</small>
											<div class="horizontal">
												<input
													type="checkbox" {...BindValueToInput(() => value != 0, newValue => setValue(newValue ? 1 : 0))}/>
												
												{schedule.fixedDayOfMonth != 0 &&
													<input type="number" min="1" max="31"{...BindValueToInput(() => value, setValue)}/>
												}
											</div>
											<small>{Lang.get("atSpecificDayOfMonth")}</small>
										</label>
								}
							}
						})}
					</div>
				}
			</div>
		</div>;
	}
}
