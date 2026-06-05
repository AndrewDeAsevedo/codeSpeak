import * as vscode from 'vscode';

export function resolvePocketBaseUrl(settingUrl?: string, envUrl?: string): string {
	const fromSetting = settingUrl?.trim();
	if (fromSetting) {
		return fromSetting;
	}

	const fromEnv = envUrl?.trim();
	if (fromEnv) {
		return fromEnv;
	}

	return '';
}

export function getPocketBaseUrl(): string {
	const settingUrl = vscode.workspace.getConfiguration('codechat').get<string>('pocketbaseUrl');
	return resolvePocketBaseUrl(settingUrl, process.env.POCKETBASE_URL);
}
