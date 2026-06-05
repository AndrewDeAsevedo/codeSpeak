export interface UserRecord {
	name?: string;
	username?: string;
	email?: string;
}

export interface MessageRecord {
	id: string;
	text?: string;
	user?: string;
	created: string;
	expand?: {
		user?: UserRecord;
	};
}

export type MessageSide = 'self' | 'other';

export function resolveDisplayName(user?: UserRecord, fallback = 'Unknown'): string {
	if (!user) {
		return fallback;
	}
	return user.name || user.username || user.email || fallback;
}

export function getMessageText(record: MessageRecord): string {
	return record.text ?? '';
}

export function getMessageAuthor(record: MessageRecord): string {
	return resolveDisplayName(record.expand?.user);
}

export function getMessageSide(record: MessageRecord, currentUserId: string): MessageSide {
	return record.user === currentUserId ? 'self' : 'other';
}
