import * as assert from 'assert';
import {
	formatMessageTimestamp,
	getMessageAuthor,
	getMessageSide,
	getMessageText,
	isGifUrl,
	parseMessageContent,
	resolveDisplayName,
	type MessageRecord,
} from '../chat/messageUtils';

suite('messageUtils', () => {
	test('getMessageText returns text field', () => {
		const record: MessageRecord = {
			id: 'abc123',
			text: 'hello world',
			created: '2026-06-05 12:00:00',
		};
		assert.strictEqual(getMessageText(record), 'hello world');
	});

	test('getMessageText returns empty string when text is missing', () => {
		const record: MessageRecord = {
			id: 'abc123',
			created: '2026-06-05 12:00:00',
		};
		assert.strictEqual(getMessageText(record), '');
	});

	test('resolveDisplayName prefers name, then username, then email', () => {
		assert.strictEqual(resolveDisplayName({ name: 'Andrew' }), 'Andrew');
		assert.strictEqual(resolveDisplayName({ username: 'andrew' }), 'andrew');
		assert.strictEqual(resolveDisplayName({ email: 'a@example.com' }), 'a@example.com');
		assert.strictEqual(resolveDisplayName({ name: 'Andrew', username: 'andrew' }), 'Andrew');
	});

	test('resolveDisplayName uses fallback when user is missing or empty', () => {
		assert.strictEqual(resolveDisplayName(undefined), 'Unknown');
		assert.strictEqual(resolveDisplayName({}, 'You'), 'You');
	});

	test('getMessageAuthor uses expanded user record', () => {
		const record: MessageRecord = {
			id: 'abc123',
			text: 'hi',
			created: '2026-06-05 12:00:00',
			expand: {
				user: { name: 'andrew' },
			},
		};
		assert.strictEqual(getMessageAuthor(record), 'andrew');
	});

	test('getMessageAuthor returns Unknown without expanded user', () => {
		const record: MessageRecord = {
			id: 'abc123',
			text: 'hi',
			created: '2026-06-05 12:00:00',
		};
		assert.strictEqual(getMessageAuthor(record), 'Unknown');
	});

	test('getMessageSide marks own messages as self and others as other', () => {
		const ownMessage: MessageRecord = {
			id: '1',
			text: 'mine',
			user: 'user_1',
			created: '2026-06-05 12:00:00',
		};
		const otherMessage: MessageRecord = {
			id: '2',
			text: 'theirs',
			user: 'user_2',
			created: '2026-06-05 12:01:00',
		};

		assert.strictEqual(getMessageSide(ownMessage, 'user_1'), 'self');
		assert.strictEqual(getMessageSide(otherMessage, 'user_1'), 'other');
	});

	test('isGifUrl detects direct gif links and common hosts', () => {
		assert.strictEqual(isGifUrl('https://example.com/image.gif'), true);
		assert.strictEqual(isGifUrl('https://example.com/image.gif?size=large'), true);
		assert.strictEqual(isGifUrl('https://media.giphy.com/media/abc123/giphy.gif'), true);
		assert.strictEqual(isGifUrl('https://media.tenor.com/abc123/tenor.gif'), true);
		assert.strictEqual(isGifUrl('https://example.com/image.png'), false);
		assert.strictEqual(isGifUrl('not-a-url'), false);
	});

	test('parseMessageContent embeds gif urls and keeps surrounding text', () => {
		const segments = parseMessageContent('look https://example.com/a.gif now');
		assert.deepStrictEqual(segments, [
			{ type: 'text', value: 'look ' },
			{ type: 'gif', url: 'https://example.com/a.gif' },
			{ type: 'text', value: ' now' },
		]);
	});

	test('parseMessageContent returns plain text when no gif urls are present', () => {
		assert.deepStrictEqual(parseMessageContent('hello world'), [{ type: 'text', value: 'hello world' }]);
	});

	test('formatMessageTimestamp shows time only for today', () => {
		const now = new Date('2026-06-05T18:00:00');
		const timestamp = formatMessageTimestamp('2026-06-05 15:30:00.000Z', now);
		assert.doesNotMatch(timestamp, /Yesterday/);
		assert.doesNotMatch(timestamp, /Jun/);
		assert.ok(timestamp.length > 0);
	});

	test('formatMessageTimestamp shows yesterday label', () => {
		const now = new Date('2026-06-05T18:00:00');
		const timestamp = formatMessageTimestamp('2026-06-04 15:30:00.000Z', now);
		assert.match(timestamp, /Yesterday/);
	});
});
