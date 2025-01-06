import {ServerSettings} from "../../shared/ServerSettings";
import {IPublicOptions} from "../../shared/IPublicOptions";

export class Options {
	public static serverSettings = new ServerSettings()
	public readonly lang: string = "en"
	public readonly root: string = process.cwd()
	public readonly frontend: string = "dist/frontend"
	public readonly sqlite: string = "dist/config"
	public readonly portHttp: number = 1304
	public readonly pathHttp: string = "/"
	public readonly pathWs: string = "/websocket"
	public readonly keepAliveTimeoutMs: number = 1000*50
	
	constructor() {
		const keys = Object.keys(this)
		
		//read environment variables:
		
		for(const key of keys) {
			if(process.env[key])
				this[key as keyof this] = process.env[key] as any
		}
		
		//read console arguments:
		
		for(const val of process.argv) {
			for(const key of keys) {
				const match = val.match(`^${key}=(.+)$`)
				if(match) {
					const type = typeof this[key as keyof this]
					switch(type) {
						case "string":
							this[key as keyof this] = match[1] as any
							break
						case "number":
							this[key as keyof this] = parseInt(match[1]) as any
							break
						case "boolean":
							this[key as keyof this] = !!match[1] as any
							break
					}
				}
			}
		}
	}
}


export class PublicOptions implements IPublicOptions {
	public readonly lang: string
	public readonly keepAliveTimeoutMs: number
	
	constructor(options: Options) {
		this.lang = options.lang; 
		this.keepAliveTimeoutMs = options.keepAliveTimeoutMs; 
	}
}
