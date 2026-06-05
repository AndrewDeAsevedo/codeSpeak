import * as assert from 'assert';
import * as vscode from 'vscode';
import { ChatViewProvider } from '../chat/chatViewProvider';
import { PocketBaseService } from '../chat/pocketbaseClient';

suite('Extension', () => {
	suiteSetup(async () => {
		const extension = vscode.extensions.all.find((entry) => entry.extensionUri.fsPath.endsWith('codechat'));
		assert.ok(extension, 'codeChat extension should be loaded in the test host');
		await extension.activate();
	});

	test('registers codeChat commands', async () => {
		const commands = await vscode.commands.getCommands(true);
		const expected = ['codechat.openChat', 'codechat.signIn', 'codechat.signOut', 'codechat.showLogs'];

		for (const command of expected) {
			assert.ok(commands.includes(command), `Missing command: ${command}`);
		}
	});

	test('exposes pocketbaseUrl configuration', () => {
		const config = vscode.workspace.getConfiguration('codechat');
		assert.strictEqual(config.get<string>('pocketbaseUrl'), '');
	});

	test('ChatViewProvider has expected view type', () => {
		assert.strictEqual(ChatViewProvider.viewType, 'codechat.chat');
	});

	test('PocketBaseService is not authenticated by default', () => {
		assert.strictEqual(PocketBaseService.isAuthenticated(), false);
	});

	test('PocketBaseService requireAuthMessage mentions sign in', () => {
		assert.match(PocketBaseService.requireAuthMessage(), /sign in/i);
	});
});
