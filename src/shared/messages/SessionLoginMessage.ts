import {BaseMessage} from "../BaseMessage";

export class SessionLoginMessage extends BaseMessage {
	constructor(
		public readonly sessionId: number | bigint,
		public readonly sessionHash: string,
		public readonly sessionTimestamp: number
	) {
		super()
	}
	
	public static async createSessionHash(sessionSecret: string, timestamp: number): Promise<string> {
		const textAsBuffer = new TextEncoder().encode(sessionSecret + timestamp)
		const hashBuffer = await crypto.subtle.digest("SHA-512", textAsBuffer)
		const hashArray = Array.from(new Uint8Array(hashBuffer))
		return hashArray
			.map((item) => item.toString(16).padStart(2, "0"))
			.join("");
	}
}
