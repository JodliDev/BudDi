import {BasePublicTable} from "./BasePublicTable";

export interface JoinedResponseEntry<T extends BasePublicTable> {
	item: Partial<T>,
	joined: Record<string, unknown>
}
