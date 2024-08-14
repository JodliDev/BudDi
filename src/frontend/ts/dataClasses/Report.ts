export enum ReportType {
	Log,
	Error,
	Exception
}

export interface Report {
	ReportId: number
	Type: ReportType
	Comment: string
	Message: string
	ReportTime: string
	Seen: boolean
}
