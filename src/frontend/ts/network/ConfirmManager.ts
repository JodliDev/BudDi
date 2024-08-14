export class ConfirmManager {
	private idCounter = 0
	private waitList: Record<number, (success: boolean) => void> = []
	
	public createConfirm(onConfirm: (success: boolean) => void): number {
		const id = ++this.idCounter
		this.waitList[id] = onConfirm
		return id
	}
	
	public runConfirm(id: number, success: boolean): boolean {
		if(this.waitList.hasOwnProperty(id)) {
			this.waitList[id](success)
			delete this.waitList[id]
			return true
		}
		else
			return false
	}
}
