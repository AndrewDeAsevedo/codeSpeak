import * as vscode from 'vscode';

let channel: vscode.OutputChannel | undefined;

export function getLogChannel(): vscode.OutputChannel {
	if (!channel) {
		channel = vscode.window.createOutputChannel('codeChat');
	}
	return channel;
}

export function log(message: string): void {
	getLogChannel().appendLine(`[${new Date().toISOString()}] ${message}`);
}

export function logError(message: string, error?: unknown): void {
	log(message);
	if (error instanceof Error) {
		log(`  ${error.message}`);
	}

	const pocketBaseError = error as { status?: number; response?: { message?: string } };
	if (pocketBaseError.status) {
		log(`  status: ${pocketBaseError.status}`);
	}
	if (pocketBaseError.response?.message) {
		log(`  response: ${pocketBaseError.response.message}`);
	}
}
