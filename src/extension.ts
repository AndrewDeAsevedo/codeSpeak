import * as vscode from 'vscode';
import { ChatViewProvider } from './chat/chatViewProvider';
import { getLogChannel, log } from './chat/logger';
import { PocketBaseService } from './chat/pocketbaseClient';

export function activate(context: vscode.ExtensionContext): void {
	log('codeChat activated');
	PocketBaseService.init(context);

	const chatViewProvider = new ChatViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			ChatViewProvider.viewType,
			chatViewProvider,
			{ webviewOptions: { retainContextWhenHidden: true } }
		),
		{ dispose: () => chatViewProvider.dispose() }
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('codechat.openChat', () => {
			chatViewProvider.show();
		}),
		vscode.commands.registerCommand('codechat.signIn', async () => {
			const signedIn = await PocketBaseService.signIn();
			if (signedIn) {
				chatViewProvider.onAuthChanged();
			}
		}),
		vscode.commands.registerCommand('codechat.signOut', async () => {
			await PocketBaseService.signOut();
			chatViewProvider.onAuthChanged();
		}),
		vscode.commands.registerCommand('codechat.showLogs', () => {
			getLogChannel().show();
		})
	);
}

export function deactivate(): void {}
