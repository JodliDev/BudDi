import {Lang} from "../../../shared/Lang";

export class UsernameAlreadyExistsException extends Error {
	message: string = Lang.get("errorUserAlreadyExists");
}
