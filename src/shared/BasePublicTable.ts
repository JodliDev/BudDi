import {LangKey} from "./Lang";

export abstract class BasePublicTable {
	getTranslation(key: keyof this): LangKey {
		return key as LangKey
	}
}
