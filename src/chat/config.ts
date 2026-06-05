import * as vscode from 'vscode';

export function normalizePocketBaseUrl(url: string): string {
	return url.trim().replace(/\/+$/, '');
}

export function resolvePocketBaseUrl(settingUrl?: string, envUrl?: string): string {
	const fromSetting = settingUrl?.trim();
	if (fromSetting) {
		return normalizePocketBaseUrl(fromSetting);
	}

	const fromEnv = envUrl?.trim();
	if (fromEnv) {
		return normalizePocketBaseUrl(fromEnv);
	}

	return '';
}

export function getPocketBaseUrl(): string {
	const settingUrl = vscode.workspace.getConfiguration('codechat').get<string>('pocketbaseUrl');
	return resolvePocketBaseUrl(settingUrl, process.env.POCKETBASE_URL);
}

export function isPocketBaseUrlConfigured(): boolean {
	return getPocketBaseUrl().length > 0;
}

export function getSyncIntervalMs(): number {
	const seconds = vscode.workspace.getConfiguration('codechat').get<number>('syncIntervalSeconds', 5);
	if (seconds <= 0) {
		return 0;
	}
	return seconds * 1000;
}

function validatePocketBaseUrl(value: string): string | undefined {
	const trimmed = value.trim();
	if (!trimmed) {
		return 'PocketBase URL is required.';
	}

	try {
		const parsed = new URL(trimmed);
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
			return 'URL must start with http:// or https://';
		}
	} catch {
		return 'Enter a valid URL (e.g. https://your-server.example)';
	}

	return undefined;
}

function validateSyncInterval(value: string): string | undefined {
	if (!value.trim()) {
		return undefined;
	}

	const seconds = Number(value);
	if (!Number.isInteger(seconds) || seconds < 0) {
		return 'Enter a whole number >= 0 (0 = realtime only).';
	}

	return undefined;
}

export async function promptForSetupIfNeeded(): Promise<boolean> {
	if (isPocketBaseUrlConfigured()) {
		return true;
	}

	const url = await vscode.window.showInputBox({
		title: 'Set up Studio Chat',
		prompt: 'PocketBase server URL',
		ignoreFocusOut: true,
		validateInput: validatePocketBaseUrl,
	});
	if (!url) {
		return false;
	}

	const syncInterval = await vscode.window.showInputBox({
		title: 'Set up Studio Chat',
		prompt: 'Poll for new messages every N seconds (0 = realtime only)',
		ignoreFocusOut: true,
		validateInput: validateSyncInterval,
	});
	if (syncInterval === undefined) {
		return false;
	}

	const config = vscode.workspace.getConfiguration('codechat');
	await config.update('pocketbaseUrl', normalizePocketBaseUrl(url), vscode.ConfigurationTarget.Global);

	const seconds = syncInterval.trim() ? Number(syncInterval) : 5;
	if (Number.isInteger(seconds) && seconds >= 0) {
		await config.update('syncIntervalSeconds', seconds, vscode.ConfigurationTarget.Global);
	}

	return true;
}
