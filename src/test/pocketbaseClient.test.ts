import * as assert from 'assert';
import { formatPocketBaseError } from '../chat/pocketbaseClient';

suite('pocketbaseClient', () => {
	test('formatPocketBaseError maps 403 to list rule guidance', () => {
		const message = formatPocketBaseError({
			status: 403,
			response: { message: 'Only superusers can perform this action.' },
		});
		assert.match(message, /403/);
		assert.match(message, /list rule/i);
	});

	test('formatPocketBaseError maps 401 to auth expired message', () => {
		const message = formatPocketBaseError({ status: 401 });
		assert.match(message, /401/);
		assert.match(message, /sign in again/i);
	});

	test('formatPocketBaseError uses PocketBase response message', () => {
		const message = formatPocketBaseError({
			status: 400,
			response: { message: 'Failed to create record.' },
		});
		assert.strictEqual(message, 'Failed to create record.');
	});

	test('formatPocketBaseError uses Error message', () => {
		assert.strictEqual(formatPocketBaseError(new Error('network down')), 'network down');
	});

	test('formatPocketBaseError handles unknown errors', () => {
		assert.strictEqual(formatPocketBaseError({}), 'Unknown PocketBase error.');
	});
});
