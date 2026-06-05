import * as vscode from 'vscode';
import { getChatHtml } from './getChatHtml';
import type { ExtensionToWebviewMessage, WebviewToExtensionMessage } from './types';

export class ChatViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'codechat.chat';

	private view: vscode.WebviewView | undefined;

	constructor(private readonly extensionUri: vscode.Uri) {}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	): void {
		this.view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this.extensionUri],
		};

		webviewView.webview.html = getChatHtml();

		webviewView.webview.onDidReceiveMessage((message: WebviewToExtensionMessage) => {
			void this.handleMessage(message);
		});

		webviewView.onDidDispose(() => {
			this.view = undefined;
		});
	}

	public show(): void {
		void vscode.commands.executeCommand('codechat.chat.focus');
	}

	private postMessage(message: ExtensionToWebviewMessage): void {
		void this.view?.webview.postMessage(message);
	}

	private async handleMessage(message: WebviewToExtensionMessage): Promise<void> {
		switch (message.type) {
			case 'sendMessage':
				await this.onSendMessage(message.text);
				break;
			case 'clearChat':
				this.onClearChat();
				break;
		}
	}

	private async onSendMessage(text: string): Promise<void> {
		this.postMessage({ type: 'appendMessage', role: 'user', text });
		this.postMessage({ type: 'setLoading', loading: true });

		try {
			const response = await this.requestAssistantResponse(text);
			this.postMessage({ type: 'appendMessage', role: 'assistant', text: response });
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Something went wrong.';
			this.postMessage({ type: 'error', message });
			return;
		}

		this.postMessage({ type: 'setLoading', loading: false });
	}

	private onClearChat(): void {
		this.postMessage({ type: 'clearMessages' });
	}

	/**
	 * Placeholder until the backend is wired up.
	 * Replace this with your API call when ready.
	 */
	private async requestAssistantResponse(userMessage: string): Promise<string> {
		await new Promise((resolve) => setTimeout(resolve, 400));

		return [
			'Backend not connected yet.',
			'',
			`You sent: "${userMessage}"`,
			'',
			'Hook up `requestAssistantResponse` in `src/chat/chatViewProvider.ts` when your backend is ready.',
		].join('\n');
	}
}
