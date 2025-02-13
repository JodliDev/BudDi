export interface JoinedResponseEntry<T> {
	item: Partial<T>,
	joined: Record<string, unknown>
}
