import * as assert from 'assert';
import { getChatHtml } from '../chat/getChatHtml';

suite('getChatHtml', () => {
	test('includes chat shell and auth controls', () => {
		const html = getChatHtml();
		assert.match(html, /codeChat/);
		assert.match(html, /id="messages"/);
		assert.match(html, /id="sign-in"/);
		assert.match(html, /id="sign-out"/);
		assert.match(html, /id="input"/);
		assert.match(html, /type: 'ready'/);
		assert.match(html, /type: 'signIn'/);
		assert.match(html, /case 'setAuthState'/);
		assert.match(html, /\.message-group\.self/);
		assert.match(html, /\.message-group\.other/);
		assert.match(html, /createMessageGroup/);
	});

	test('includes content security policy', () => {
		const html = getChatHtml();
		assert.match(html, /Content-Security-Policy/);
		assert.match(html, /default-src 'none'/);
	});
});
