import {Options} from "./Options";
import {existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync} from "node:fs";
import {UnknownErrorException} from "./exceptions/UnknownErrorException";

export class FileDataStore {
	static readonly MAX_FILE_TRIES = 1000
	private currentId: number | bigint = Date.now()
	private readonly fileFolderPath: string
	
	constructor(private options: Options) {
		this.fileFolderPath = `${this.options.root}/${this.options.files}`
		if(!existsSync(this.fileFolderPath))
			mkdirSync(this.fileFolderPath, {recursive: true})
	}
	
	public getFile(id: number | bigint): Buffer | undefined {
		const path = `${this.fileFolderPath}/${id}`
		return existsSync(path) ? readFileSync(path) : undefined
	}
	public saveFile(buffer: ArrayBuffer | Buffer | Buffer[]): number | bigint {
		let tries = FileDataStore.MAX_FILE_TRIES
		
		let path: string
		do {
			path = `${this.fileFolderPath}/${++this.currentId}`
			if(--tries <= 0) {
				console.error(`Could not find a file id that has not been used before! Last try: ${this.currentId}`)
				throw new UnknownErrorException
			}
		} while(existsSync(path));
		
		if(Array.isArray(buffer)) {
			const file = new File(buffer, path)
			
			file.arrayBuffer().then((arrayBuffer) => {
				writeFileSync(path, Buffer.from(arrayBuffer))
			})
		}
		else
			writeFileSync(path, Buffer.from(buffer))
		
		return this.currentId
	}
	
	public deleteFile(id: number | bigint): void {
		const path = `${this.fileFolderPath}/${id}`
		if(existsSync(path))
			unlinkSync(path)
	}
}
