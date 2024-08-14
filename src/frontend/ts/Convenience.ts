import { Cookies } from "../../shared/Cookies";

export function getCookie(name: keyof typeof Cookies): string | undefined {
	//Thanks to: https://stackoverflow.com/questions/10730362/get-cookie-by-name
	const value = `; ${document.cookie}`
	const parts = value.split(`; ${name}=`)
	if(parts.length === 2)
		return parts.pop()?.split(';').shift()
}
export function setCookie(name: keyof typeof Cookies, value: string, expires?: number): void {
	const expiresString = expires ? `expires=${new Date(expires).toUTCString()}; ` : ""
	document.cookie = `${name}=${value}; ${expiresString}path=./; SameSite=Strict`;
}
export function deleteCookie(name: keyof typeof Cookies): void {
	document.cookie = `${name}=; Max-Age=0; SameSite=Strict`
}
