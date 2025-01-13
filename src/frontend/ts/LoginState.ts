import m from "mithril";
import {LocalStorageKeys} from "./LocalStorageKeys";
import {deleteCookie, setCookie} from "../../shared/Cookies";

export class LoginState {
	private loggedInValue: boolean = false;
	private adminValue: boolean = false
	private observer: Record<number, ((isLoggedIn: boolean) => void)> = {}
	private currentId: number = 0
	
	private runObservers(): void {
		for(const id in this.observer) {
			this.observer[id](this.loggedInValue);
		}
	}
	
	public reactToChange(callback: (isLoggedIn: boolean) => void): number {
		this.observer[++this.currentId] = callback
		return this.currentId
	}
	public removeObserver(id: number): void {
		if(this.observer.hasOwnProperty(id))
			delete this.observer[id]
	}
	
	public isLoggedIn(): boolean {
		return this.loggedInValue
	}
	public isAdmin(): boolean {
		return this.adminValue
	}
	
	public setAdmin(): void {
		this.adminValue = true
	}
	
	public login(sessionId: number | bigint, sessionHash?: string): void {
		setCookie("sessionId", sessionId.toString(), 1000 * 60 * 60 * 24 * 90)
		if(sessionHash)
			localStorage.setItem(LocalStorageKeys.sessionSecret, sessionHash)
		this.loggedInValue = true
		this.runObservers()
	}
	
	public logout(): void {
		deleteCookie("sessionId")
		localStorage.removeItem(LocalStorageKeys.sessionSecret)
		this.loggedInValue = false
		this.adminValue = false
		this.runObservers()
		m.redraw()
	}
}
