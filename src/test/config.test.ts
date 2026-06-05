import * as assert from 'assert';
import { getSyncIntervalMs, normalizePocketBaseUrl, resolvePocketBaseUrl } from '../chat/config';

suite('config', () => {
	test('resolvePocketBaseUrl prefers VS Code setting over env', () => {
		assert.strictEqual(
			resolvePocketBaseUrl('https://settings.example/', 'https://env.example/'),
			'https://settings.example'
		);
	});

	test('resolvePocketBaseUrl falls back to env when setting is empty', () => {
		assert.strictEqual(resolvePocketBaseUrl('', 'https://env.example/'), 'https://env.example');
		assert.strictEqual(resolvePocketBaseUrl(undefined, 'https://env.example/'), 'https://env.example');
	});

	test('resolvePocketBaseUrl returns empty when nothing is configured', () => {
		assert.strictEqual(resolvePocketBaseUrl(), '');
		assert.strictEqual(resolvePocketBaseUrl('   ', '   '), '');
	});

	test('normalizePocketBaseUrl trims and removes trailing slashes', () => {
		assert.strictEqual(normalizePocketBaseUrl('  https://example.com/  '), 'https://example.com');
		assert.strictEqual(normalizePocketBaseUrl('https://example.com///'), 'https://example.com');
	});

	test('getSyncIntervalMs defaults to 5 seconds', () => {
		assert.strictEqual(getSyncIntervalMs(), 5000);
	});
});
