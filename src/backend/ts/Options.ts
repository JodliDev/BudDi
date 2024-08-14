export class Options {
	public readonly lang: string = "en"
	public readonly frontend: string = `${__dirname}/../frontend/`
	public readonly sqlite: string = `${__dirname}/../config/`
	public readonly portHttp: number = 1304
	public readonly pathHttp: string = "/"
	public readonly portWs: number = 13040
	public readonly pathWs: string = "/websocket"
	
	constructor() {
		const keys = Object.keys(this)
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
					}
				}
			}
			
			
			// let match = val.match("^lang=(.+)$")
			// if(match) {
			// 	this.lang = match[1]
			// 	return
			// }
			//
			// match = val.match("^frontend=(.+)$")
			// if(match) {
			// 	this.pathFrontend = match[1]
			// 	return
			// }
			//
			// match = val.match("^sqlite=(.+)$")
			// if(match) {
			// 	this.sqlite = match[1]
			// 	return
			// }
			//
			// match = val.match("^portHttp=(.+)$")
			// if(match) {
			// 	this.portHttp = parseInt(match[1])
			// 	return
			// }
			//
			// match = val.match("^portWs=(.+)$")
			// if(match) {
			// 	this.portWs = parseInt(match[1])
			// 	return
			// }
		}
	}
}
