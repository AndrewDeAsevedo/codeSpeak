/** Messages sent from the webview to the extension. */
export type WebviewToExtensionMessage =
	| { type: 'sendMessage'; text: string }
	| { type: 'clearChat' };

/** Messages sent from the extension to the webview. */
export type ExtensionToWebviewMessage =
	| { type: 'appendMessage'; role: 'user' | 'assistant'; text: string }
	| { type: 'setLoading'; loading: boolean }
	| { type: 'error'; message: string }
	| { type: 'clearMessages' };
