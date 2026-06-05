import * as path from 'path';
import * as vscode from 'vscode';
import dotenv from 'dotenv';
import { getPocketBaseUrl } from './config';
import { log, logError } from './logger';
import { resolveDisplayName } from './messageUtils';

const AUTH_SECRET_KEY = 'codechat.pocketbase.auth';

interface PocketBaseClient {
	authStore: {
		isValid: boolean;
		record: { id: string; name?: string; username?: string; email?: string };
		clear(): void;
	};
	collection(name: string): {
		authWithPassword(identity: string, password: string): Promise<unknown>;
		authRefresh(): Promise<unknown>;
		getList<T>(
			page: number,
			perPage: number,
			options?: { sort?: string; expand?: string }
		): Promise<{ items: T[]; totalItems: number }>;
		create<T>(data: Record<string, unknown>): Promise<T>;
	};
}

export function formatPocketBaseError(error: unknown): string {
	const pocketBaseError = error as { status?: number; response?: { message?: string } };
	const status = pocketBaseError.status;
	const responseMessage = pocketBaseError.response?.message;

	if (status === 403) {
		return 'PocketBase denied access (403). Update the messages collection list rule so signed-in users can read records.';
	}

	if (status === 401) {
		return 'PocketBase auth expired (401). Sign in again.';
	}

	if (responseMessage) {
		return responseMessage;
	}

	if (error instanceof Error) {
		return error.message;
	}

	return 'Unknown PocketBase error.';
}

export class PocketBaseService {
	private static context: vscode.ExtensionContext | undefined;
	private static client: PocketBaseClient | undefined;
	private static clientReady: Promise<PocketBaseClient> | undefined;

	static init(context: vscode.ExtensionContext): void {
		this.context = context;
		dotenv.config({ path: path.join(context.extensionPath, '.env') });
		void this.getClient();
	}

	static isAuthenticated(): boolean {
		return this.client?.authStore.isValid ?? false;
	}

	static getUserId(): string | undefined {
		return this.client?.authStore.record?.id;
	}

	static getUserDisplayName(): string {
		return resolveDisplayName(this.client?.authStore.record, 'You');
	}

	static async getClient(): Promise<PocketBaseClient> {
		if (!this.context) {
			throw new Error('PocketBaseService is not initialized.');
		}

		if (!this.clientReady) {
			this.clientReady = this.createClient();
		}

		return this.clientReady;
	}

	static async signIn(): Promise<boolean> {
		const identity = await vscode.window.showInputBox({
			title: 'Sign in to codeChat',
			prompt: 'PocketBase email or username',
			placeHolder: 'andrew or you@example.com',
			ignoreFocusOut: true,
			validateInput: (value) => (value.trim().length > 0 ? undefined : 'Email or username is required.'),
		});
		if (!identity) {
			return false;
		}

		const password = await vscode.window.showInputBox({
			title: 'Sign in to codeChat',
			prompt: 'PocketBase password',
			password: true,
			ignoreFocusOut: true,
			validateInput: (value) => (value.length > 0 ? undefined : 'Password is required.'),
		});
		if (!password) {
			return false;
		}

		try {
			const client = await this.getClient();
			await client.collection('users').authWithPassword(identity, password);
			log(`Signed in as ${this.getUserDisplayName()} (${client.authStore.record.id})`);
			vscode.window.showInformationMessage(`Signed in to codeChat as ${this.getUserDisplayName()}.`);
			return true;
		} catch (error) {
			logError('Sign in failed', error);
			vscode.window.showErrorMessage(`Sign in failed: ${formatPocketBaseError(error)}`);
			return false;
		}
	}

	static async signOut(): Promise<void> {
		const client = await this.client;
		if (client) {
			client.authStore.clear();
		}
		if (this.context) {
			await this.context.secrets.delete(AUTH_SECRET_KEY);
		}
		log('Signed out');
		vscode.window.showInformationMessage('Signed out of codeChat.');
	}

	static requireAuthMessage(): string {
		return 'Sign in to load messages.';
	}

	private static async createClient(): Promise<PocketBaseClient> {
		const context = this.context;
		if (!context) {
			throw new Error('PocketBaseService is not initialized.');
		}

		const savedAuth = await context.secrets.get(AUTH_SECRET_KEY);
		const { default: PocketBase, AsyncAuthStore } = await import('pocketbase');
		const authStore = new AsyncAuthStore({
			save: async (serialized) => {
				await context.secrets.store(AUTH_SECRET_KEY, serialized);
			},
			clear: async () => {
				await context.secrets.delete(AUTH_SECRET_KEY);
			},
		});

		const url = getPocketBaseUrl();
		if (!url) {
			throw new Error(
				'PocketBase URL is not configured. Set POCKETBASE_URL in .env or codechat.pocketbaseUrl in VS Code settings.'
			);
		}

		const client = new PocketBase(url, authStore) as PocketBaseClient;
		this.client = client;

		if (savedAuth) {
			this.restoreAuth(authStore, savedAuth);
			log(`Restored saved auth for ${this.getUserDisplayName()}`);
		}

		await this.refreshAuthIfNeeded();
		return client;
	}

	private static restoreAuth(
		authStore: { save(token: string, record?: unknown): void },
		savedAuth: string
	): void {
		try {
			const data = JSON.parse(savedAuth) as {
				token?: string;
				record?: unknown;
				model?: unknown;
			};
			authStore.save(data.token ?? '', data.record ?? data.model);
		} catch {
			log('Failed to parse saved auth token');
		}
	}

	private static async refreshAuthIfNeeded(): Promise<void> {
		const client = this.client;
		if (!client?.authStore.isValid) {
			return;
		}

		try {
			await client.collection('users').authRefresh();
			log('Auth refresh succeeded');
		} catch (error) {
			logError('Auth refresh failed', error);
			const status = (error as { status?: number })?.status;
			if (status === 401 || status === 403) {
				client.authStore.clear();
			}
		}
	}
}
