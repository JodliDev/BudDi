export const Convenience = {
	stringIsSafe(value: string): boolean {
		return value.match(/^([A-Za-z0-9 ])+$/) != null
	}
}
