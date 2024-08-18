export function BindValueToInput<T>(get: () => T, set: (value: T) => void) {
	const attrValue = get()
	
	const toValue = typeof attrValue == "number"
		? (value: string) => parseInt(value)
		: (value: string) => value 
	
	const attr = typeof attrValue == "boolean" ? "checked" : "value"
	
	return {
		[attr]: attrValue,
		"onchange": (e: InputEvent) => {
			const element = e.target as HTMLInputElement
			set(toValue(element[attr!] as string) as T)
		}
	}
}
