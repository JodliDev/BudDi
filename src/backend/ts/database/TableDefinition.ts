import {TableSettings} from "./TableSettings";



export interface TableDefinition {
	getPrimaryKey(): keyof any
	getSettings?(): TableSettings<any>
}
