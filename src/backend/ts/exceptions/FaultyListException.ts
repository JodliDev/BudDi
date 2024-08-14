import {Lang} from "../../../shared/Lang";

export class FaultyListException extends Error {
	message: string = Lang.get("errorFaultyList");
}
