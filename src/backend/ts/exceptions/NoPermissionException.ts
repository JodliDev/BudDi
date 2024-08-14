import {Lang} from "../../../shared/Lang";

export class NoPermissionException extends Error {
	message: string = Lang.get("errorNoPermission");
}
