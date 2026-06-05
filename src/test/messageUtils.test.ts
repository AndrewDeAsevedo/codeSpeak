import * as assert from 'assert';
import {
	getMessageAuthor,
	getMessageSide,
	getMessageText,
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
});
