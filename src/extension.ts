import * as vscode from 'vscode';
import { ChatViewProvider } from './chat/chatViewProvider';

export function activate(context: vscode.ExtensionContext): void {
	const chatViewProvider = new ChatViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			ChatViewProvider.viewType,
			chatViewProvider,
			{ webviewOptions: { retainContextWhenHidden: true } }
		)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('codechat.openChat', () => {
			chatViewProvider.show();
		})
	);
}

export function deactivate(): void {}
