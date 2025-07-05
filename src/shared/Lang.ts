import fallbackLang from "./locales/en.json";

let langRecord: Record<string, string> = {}

export type LangKey = keyof typeof fallbackLang

class LangClass {
	private code = "en"
	private isInit = false
	public async init(langCode: string): Promise<void> {
		this.code = langCode
		if(langCode == "en")
			return
		try {
			langRecord = await import(`./locales/${langCode}.json`)
		}
		catch(error: unknown) {
			console.error(error as string)
		}
		this.isInit = true
	}
	public has(key: string) {
		return langRecord.hasOwnProperty(key) || fallbackLang.hasOwnProperty(key)
	}
	public getDynamic(key: string): string {
		return this.get(key as keyof typeof fallbackLang)
	}
	public get(key: LangKey, ... replacers: Array<string | number>): string {
		let value
		if(langRecord.hasOwnProperty(key))
			value = langRecord[key]
		else if(fallbackLang.hasOwnProperty(key))
			value = fallbackLang[key]
		else {
			langRecord[key] = key
			console.error(`Lang: ${key} does not exist`)
			return key
		}
		
		if(replacers.length) {
			let i = 1
			for(const replace of replacers) {
				let search
				switch(typeof replace) {
					case "number":
						search = `%${i++}$d`
						break;
					case "string":
						search = `%${i++}$s`
						break;
				}
				value = value.replaceAll(search, replace?.toString() ?? "")
			}
			return value
		}
		else
			return value
	}
	public getWithColon(key: LangKey, ... replacers: Array<string | number>): string {
		return Lang.get("colon", Lang.get(key, ...replacers))
	}
}

export const Lang = new LangClass()
