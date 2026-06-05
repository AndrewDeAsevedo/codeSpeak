export function getChatHtml(): string {
	const cspSource = [
		"default-src 'none'",
		"style-src 'unsafe-inline'",
		"script-src 'unsafe-inline'",
	].join('; ');

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8" />
	<meta http-equiv="Content-Security-Policy" content="${cspSource}" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>codeChat</title>
	<style>
		* {
			box-sizing: border-box;
		}

		body {
			margin: 0;
			height: 100vh;
			display: flex;
			flex-direction: column;
			font-family: var(--vscode-font-family);
			font-size: var(--vscode-font-size);
			color: var(--vscode-foreground);
			background: var(--vscode-sideBar-background);
		}

		#messages {
			flex: 1;
			overflow-y: auto;
			padding: 8px;
			display: flex;
			flex-direction: column;
			gap: 8px;
		}

		.message {
			max-width: 100%;
			padding: 10px 12px;
			border-radius: 8px;
			line-height: 1.5;
			white-space: pre-wrap;
			word-break: break-word;
		}

		.message.user {
			align-self: flex-end;
			background: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
		}

		.message.assistant {
			align-self: flex-start;
			background: var(--vscode-input-background);
			border: 1px solid var(--vscode-input-border, transparent);
		}

		.empty-state {
			margin: auto;
			text-align: center;
			color: var(--vscode-descriptionForeground);
			max-width: 320px;
			line-height: 1.6;
		}

		#composer {
			display: flex;
			flex-wrap: wrap;
			gap: 6px;
			padding: 8px;
			border-top: 1px solid var(--vscode-panel-border, var(--vscode-widget-border, transparent));
			background: var(--vscode-sideBar-background);
		}

		#input {
			flex: 1 1 100%;
			width: 100%;
			resize: none;
			min-height: 40px;
			max-height: 160px;
			padding: 10px 12px;
			border-radius: 6px;
			border: 1px solid var(--vscode-input-border, transparent);
			background: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			font: inherit;
		}

		#input:focus {
			outline: 1px solid var(--vscode-focusBorder);
		}

		#send,
		#clear {
			border: none;
			border-radius: 6px;
			padding: 0 14px;
			font: inherit;
			cursor: pointer;
		}

		#send {
			background: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
		}

		#send:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		#clear {
			background: transparent;
			color: var(--vscode-foreground);
			border: 1px solid var(--vscode-button-border, var(--vscode-input-border, transparent));
		}

		#status {
			min-height: 18px;
			padding: 0 8px 4px;
			font-size: 0.9em;
			color: var(--vscode-descriptionForeground);
		}

		.error {
			color: var(--vscode-errorForeground);
		}
	</style>
</head>
<body>
	<div id="messages">
		<div class="empty-state" id="empty-state">
			<strong>codeChat</strong><br />
			Ask a question about your code. The backend is not connected yet.
		</div>
	</div>
	<div id="status"></div>
	<form id="composer">
		<textarea id="input" rows="1" placeholder="Ask codeChat..." aria-label="Message input"></textarea>
		<button type="button" id="clear" title="Clear chat">Clear</button>
		<button type="submit" id="send">Send</button>
	</form>

	<script>
		const vscode = acquireVsCodeApi();
		const messagesEl = document.getElementById('messages');
		const emptyStateEl = document.getElementById('empty-state');
		const statusEl = document.getElementById('status');
		const formEl = document.getElementById('composer');
		const inputEl = document.getElementById('input');
		const sendEl = document.getElementById('send');
		const clearEl = document.getElementById('clear');

		let isLoading = false;

		function setLoading(loading) {
			isLoading = loading;
			sendEl.disabled = loading;
			inputEl.disabled = loading;
			statusEl.textContent = loading ? 'Waiting for response...' : '';
			statusEl.classList.toggle('error', false);
		}

		function appendMessage(role, text) {
			if (emptyStateEl) {
				emptyStateEl.remove();
			}

			const messageEl = document.createElement('div');
			messageEl.className = 'message ' + role;
			messageEl.textContent = text;
			messagesEl.appendChild(messageEl);
			messagesEl.scrollTop = messagesEl.scrollHeight;
		}

		function clearMessages() {
			messagesEl.innerHTML = '';
			const empty = document.createElement('div');
			empty.className = 'empty-state';
			empty.id = 'empty-state';
			empty.innerHTML = '<strong>codeChat</strong><br />Ask a question about your code. The backend is not connected yet.';
			messagesEl.appendChild(empty);
			statusEl.textContent = '';
			statusEl.classList.remove('error');
		}

		formEl.addEventListener('submit', (event) => {
			event.preventDefault();
			const text = inputEl.value.trim();
			if (!text || isLoading) {
				return;
			}

			vscode.postMessage({ type: 'sendMessage', text });
			inputEl.value = '';
			inputEl.style.height = 'auto';
		});

		clearEl.addEventListener('click', () => {
			if (isLoading) {
				return;
			}
			vscode.postMessage({ type: 'clearChat' });
		});

		inputEl.addEventListener('keydown', (event) => {
			if (event.key === 'Enter' && !event.shiftKey) {
				event.preventDefault();
				formEl.requestSubmit();
			}
		});

		inputEl.addEventListener('input', () => {
			inputEl.style.height = 'auto';
			inputEl.style.height = Math.min(inputEl.scrollHeight, 160) + 'px';
		});

		window.addEventListener('message', (event) => {
			const message = event.data;
			switch (message.type) {
				case 'appendMessage':
					appendMessage(message.role, message.text);
					break;
				case 'setLoading':
					setLoading(message.loading);
					break;
				case 'error':
					statusEl.textContent = message.message;
					statusEl.classList.add('error');
					setLoading(false);
					break;
				case 'clearMessages':
					clearMessages();
					break;
			}
		});
	</script>
</body>
</html>`;
}
