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

export type MessageContentSegment =
	| { type: 'text'; value: string }
	| { type: 'gif'; url: string };

const URL_REGEX = /https?:\/\/[^\s<>"']+/gi;

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

export function parseMessageDate(created: string): Date {
	if (created.includes('T')) {
		return new Date(created);
	}

	return new Date(created.replace(' ', 'T'));
}

export function formatMessageTimestamp(created: string, now: Date = new Date()): string {
	const date = parseMessageDate(created);
	if (Number.isNaN(date.getTime())) {
		return '';
	}

	const timeFormatter = new Intl.DateTimeFormat(undefined, {
		hour: 'numeric',
		minute: '2-digit',
	});

	const startOfDay = (value: Date): Date =>
		new Date(value.getFullYear(), value.getMonth(), value.getDate());

	const dayDiff =
		(startOfDay(now).getTime() - startOfDay(date).getTime()) / (24 * 60 * 60 * 1000);

	if (dayDiff === 0) {
		return timeFormatter.format(date);
	}

	if (dayDiff === 1) {
		return `Yesterday ${timeFormatter.format(date)}`;
	}

	if (dayDiff < 7) {
		return new Intl.DateTimeFormat(undefined, {
			weekday: 'short',
			hour: 'numeric',
			minute: '2-digit',
		}).format(date);
	}

	return new Intl.DateTimeFormat(undefined, {
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	}).format(date);
}

function stripTrailingPunctuation(url: string): string {
	return url.replace(/[.,!?;:]+$/, '');
}

export function isGifUrl(url: string): boolean {
	const normalized = stripTrailingPunctuation(url.trim());

	try {
		const parsed = new URL(normalized);
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
			return false;
		}

		const path = parsed.pathname.toLowerCase();
		const host = parsed.hostname.toLowerCase();

		if (path.endsWith('.gif')) {
			return true;
		}

		if (host.includes('giphy.com') && path.includes('/media/')) {
			return true;
		}

		if (host.includes('tenor.com') && (path.includes('/gif') || path.endsWith('.gif'))) {
			return true;
		}

		return false;
	} catch {
		return false;
	}
}

export function parseMessageContent(text: string): MessageContentSegment[] {
	const segments: MessageContentSegment[] = [];
	let lastIndex = 0;

	for (const match of text.matchAll(URL_REGEX)) {
		const rawUrl = match[0];
		const url = stripTrailingPunctuation(rawUrl);

		if (!isGifUrl(url)) {
			continue;
		}

		const before = text.slice(lastIndex, match.index);
		if (before) {
			segments.push({ type: 'text', value: before });
		}

		segments.push({ type: 'gif', url });
		lastIndex = (match.index ?? 0) + rawUrl.length;
	}

	const remaining = text.slice(lastIndex);
	if (remaining) {
		segments.push({ type: 'text', value: remaining });
	}

	if (segments.length === 0) {
		return [{ type: 'text', value: text }];
	}

	return segments;
}
