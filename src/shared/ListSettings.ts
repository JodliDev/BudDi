import {Class} from "./Class";

export class ListSettings {
	protected constructor(readonly primaryKey: string) { }
	
	public static getSettings<ListT>(primaryKey: keyof ListT, type = ListSettings) {
		return new ListSettings(primaryKey.toString())
	}
}
