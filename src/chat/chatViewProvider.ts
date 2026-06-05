import * as vscode from 'vscode';
import { getChatHtml } from './getChatHtml';
import { logError } from './logger';
import {
	getMessageAuthor,
	getMessageSide,
	getMessageText,
	type MessageRecord,
} from './messageUtils';
import { formatPocketBaseError, PocketBaseService } from './pocketbaseClient';
import type { ExtensionToWebviewMessage, WebviewToExtensionMessage } from './types';

const EMPTY_MESSAGES_ERROR =
	'Signed in, but PocketBase returned 0 messages. Set the messages collection List/Search rule to: @request.auth.id != ""';

export class ChatViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'codechat.chat';

	private view: vscode.WebviewView | undefined;
	private webviewReady = false;
	private pendingReload = false;

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
		webviewView.webview.onDidReceiveMessage((message) => {
			void this.handleMessage(message);
		});
		webviewView.onDidDispose(() => {
			this.view = undefined;
			this.webviewReady = false;
		});
	}

	public show(): void {
		void vscode.commands.executeCommand('codechat.chat.focus');
	}

	public onAuthChanged(): void {
		this.reloadChat();
	}

	private postMessage(message: ExtensionToWebviewMessage): void {
		if (!this.view) {
			return;
		}

		void this.view.webview.postMessage(message);
	}

	private reloadChat(): void {
		if (!this.webviewReady) {
			this.pendingReload = true;
			return;
		}

		this.postMessage({ type: 'clearMessages' });
		void this.loadMessages();
	}

	private async fetchMessages(): Promise<MessageRecord[]> {
		const client = await PocketBaseService.getClient();
		const query = { sort: 'created', expand: 'user' } as const;

		try {
			const result = await client.collection('messages').getList<MessageRecord>(1, 200, query);
			return result.items;
		} catch (expandError) {
			logError('Fetch with expand failed; retrying without expand', expandError);
			const result = await client.collection('messages').getList<MessageRecord>(1, 200, {
				sort: 'created',
			});
			return result.items;
		}
	}

	private toAppendMessage(record: MessageRecord, currentUserId: string): ExtensionToWebviewMessage {
		return {
			type: 'appendMessage',
			role: getMessageSide(record, currentUserId),
			text: getMessageText(record),
			author: getMessageAuthor(record),
		};
	}

	private async loadMessages(): Promise<void> {
		try {
			const client = await PocketBaseService.getClient();
			if (!client.authStore.isValid) {
				this.postMessage({ type: 'setAuthState', signedIn: false });
				return;
			}

			const user = PocketBaseService.getUserDisplayName();
			const currentUserId = PocketBaseService.getUserId() ?? '';
			this.postMessage({ type: 'setAuthState', signedIn: true, user });

			const records = await this.fetchMessages();
			let messageCount = 0;

			for (const record of records) {
				const text = getMessageText(record);
				if (!text) {
					continue;
				}

				messageCount += 1;
				this.postMessage(this.toAppendMessage(record, currentUserId));
			}

			if (messageCount === 0) {
				this.postMessage({ type: 'error', message: EMPTY_MESSAGES_ERROR });
				this.postMessage({ type: 'setAuthState', signedIn: true, user });
			}
		} catch (error) {
			logError('loadMessages failed', error);
			this.postMessage({ type: 'error', message: formatPocketBaseError(error) });
		}
	}

	private async handleMessage(message: WebviewToExtensionMessage): Promise<void> {
		switch (message.type) {
			case 'ready':
				this.webviewReady = true;
				if (this.pendingReload) {
					this.pendingReload = false;
				}
				this.reloadChat();
				break;
			case 'signIn':
				if (await PocketBaseService.signIn()) {
					this.reloadChat();
				}
				break;
			case 'signOut':
				await PocketBaseService.signOut();
				this.postMessage({ type: 'clearMessages' });
				this.postMessage({ type: 'setAuthState', signedIn: false });
				break;
			case 'sendMessage':
				await this.onSendMessage(message.text);
				break;
			case 'clearChat':
				this.reloadChat();
				break;
		}
	}

	private async onSendMessage(text: string): Promise<void> {
		const client = await PocketBaseService.getClient();
		if (!client.authStore.isValid) {
			this.postMessage({ type: 'setAuthState', signedIn: false });
			return;
		}

		const author = PocketBaseService.getUserDisplayName();
		this.postMessage({ type: 'appendMessage', role: 'self', text, author });
		this.postMessage({ type: 'setLoading', loading: true });

		try {
			await client.collection('messages').create({
				text,
				user: client.authStore.record.id,
			});
		} catch (error) {
			logError('saveMessage failed', error);
			this.postMessage({ type: 'error', message: formatPocketBaseError(error) });
			return;
		} finally {
			this.postMessage({ type: 'setLoading', loading: false });
		}
	}
}
