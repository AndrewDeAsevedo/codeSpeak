/** Messages sent from the webview to the extension. */
export type WebviewToExtensionMessage =
	| { type: 'ready' }
	| { type: 'signIn' }
	| { type: 'signOut' }
	| { type: 'sendMessage'; text: string }
	| { type: 'clearChat' };

/** Messages sent from the extension to the webview. */
export type ExtensionToWebviewMessage =
	| { type: 'appendMessage'; role: 'self' | 'other'; text: string; author?: string }
	| { type: 'setAuthState'; signedIn: boolean; user?: string }
	| { type: 'setLoading'; loading: boolean }
	| { type: 'error'; message: string }
	| { type: 'clearMessages' };
