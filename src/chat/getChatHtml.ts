export function getChatHtml(): string {
	const cspSource = [
		"default-src 'none'",
		"style-src 'unsafe-inline'",
		"script-src 'unsafe-inline'",
		"img-src https: http: data:",
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
			gap: 10px;
		}

		.message-group {
			display: flex;
			flex-direction: column;
			gap: 2px;
			max-width: 100%;
		}

		.message-group.self {
			align-self: flex-end;
			align-items: flex-end;
		}

		.message-group.other {
			align-self: flex-start;
			align-items: flex-start;
		}

		.message-author {
			font-size: 0.8em;
			font-weight: 600;
			color: var(--vscode-descriptionForeground);
			margin-top: 2px;
		}

		.message {
			max-width: 100%;
			padding: 10px 12px;
			border-radius: 8px;
			line-height: 1.5;
			word-break: break-word;
		}

		.message-content {
			white-space: pre-wrap;
		}

		.message-gif {
			display: block;
			max-width: min(280px, 100%);
			max-height: 220px;
			border-radius: 6px;
			margin-top: 6px;
			object-fit: contain;
		}

		.message-gif:first-child {
			margin-top: 0;
		}

		.message-time {
			display: block;
			margin-top: 4px;
			font-size: 0.68em;
			line-height: 1.2;
			opacity: 0.65;
			text-align: right;
		}

		.message.other .message-time {
			color: var(--vscode-descriptionForeground);
		}

		.message.self .message-time {
			color: inherit;
		}

		.message.gif-only {
			padding: 6px;
		}

		.message.gif-only .message-time {
			padding: 0 4px;
		}

		.message.self {
			background: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
		}

		.message.other {
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

		.auth-actions {
			display: flex;
			justify-content: center;
			gap: 8px;
			margin-top: 12px;
		}

		.auth-actions button {
			border: none;
			border-radius: 6px;
			padding: 6px 14px;
			font: inherit;
			cursor: pointer;
			background: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
		}

		#auth-bar {
			display: none;
			align-items: center;
			justify-content: space-between;
			gap: 8px;
			padding: 6px 8px 0;
			font-size: 0.85em;
			color: var(--vscode-descriptionForeground);
		}

		#auth-bar.visible {
			display: flex;
		}

		#sign-out {
			border: none;
			background: transparent;
			color: var(--vscode-textLink-foreground);
			font: inherit;
			cursor: pointer;
			padding: 0;
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
	<div id="auth-bar">
		<span id="auth-user"></span>
		<button type="button" id="sign-out">Sign Out</button>
	</div>
	<div id="messages">
		<div class="empty-state" id="empty-state">
			<strong>codeChat</strong><br />
			Sign in to load your messages.
			<div class="auth-actions">
				<button type="button" id="sign-in">Sign In</button>
			</div>
		</div>
	</div>
	<div id="status"></div>
	<form id="composer">
		<textarea id="input" rows="1" aria-label="Message input"></textarea>
		<button type="button" id="clear" title="Clear chat">Clear</button>
		<button type="submit" id="send">Send</button>
	</form>

	<script>
		const vscode = acquireVsCodeApi();
		const messagesEl = document.getElementById('messages');
		const statusEl = document.getElementById('status');
		const formEl = document.getElementById('composer');
		const inputEl = document.getElementById('input');
		const sendEl = document.getElementById('send');
		const clearEl = document.getElementById('clear');
		const authBarEl = document.getElementById('auth-bar');
		const authUserEl = document.getElementById('auth-user');
		const signInEl = document.getElementById('sign-in');
		const signOutEl = document.getElementById('sign-out');

		let isLoading = false;
		let signedIn = false;
		let currentUser = '';

		function hasMessages() {
			return messagesEl.querySelector('.message-group') !== null;
		}

		function updateEmptyState(user) {
			let empty = document.getElementById('empty-state');
			if (!empty) {
				empty = document.createElement('div');
				empty.className = 'empty-state';
				empty.id = 'empty-state';
				messagesEl.appendChild(empty);
			}

			if (!signedIn) {
				empty.innerHTML = '<strong>codeChat</strong><br />Sign in to load your messages.<div class="auth-actions"><button type="button" id="sign-in">Sign In</button></div>';
				empty.querySelector('#sign-in').addEventListener('click', () => {
					vscode.postMessage({ type: 'signIn' });
				});
				return;
			}

			const userLine = user ? 'Signed in as <strong>' + user + '</strong>.<br />' : '';
			empty.innerHTML = '<strong>codeChat</strong><br />' + userLine + 'No messages yet.';
		}

		function setAuthState(nextSignedIn, user) {
			signedIn = nextSignedIn;
			currentUser = user || '';
			authBarEl.classList.toggle('visible', signedIn);
			authUserEl.textContent = signedIn && currentUser ? 'Signed in as ' + currentUser : '';
			inputEl.disabled = !signedIn || isLoading;
			sendEl.disabled = !signedIn || isLoading;

			if (!hasMessages()) {
				updateEmptyState(user);
			}
		}

		function setLoading(loading) {
			isLoading = loading;
			inputEl.disabled = !signedIn || loading;
			sendEl.disabled = !signedIn || loading;
			statusEl.textContent = loading ? 'Sending...' : '';
			statusEl.classList.toggle('error', false);
		}

		function getLastMessageGroup() {
			const groups = messagesEl.querySelectorAll('.message-group');
			return groups.length ? groups[groups.length - 1] : null;
		}

		function isSameSender(group, role, author) {
			if (!group) {
				return false;
			}
			return group.dataset.role === role && group.dataset.author === (author || '');
		}

		function createMessageBubble(role, text, timestamp, segments) {
			const messageEl = document.createElement('div');
			const contentSegments = segments && segments.length
				? segments
				: [{ type: 'text', value: text }];
			const isGifOnly = contentSegments.every((segment) => segment.type === 'gif');

			messageEl.className = 'message ' + role + (isGifOnly ? ' gif-only' : '');

			const contentEl = document.createElement('div');
			contentEl.className = 'message-content';

			for (const segment of contentSegments) {
				if (segment.type === 'gif') {
					const imgEl = document.createElement('img');
					imgEl.className = 'message-gif';
					imgEl.src = segment.url;
					imgEl.alt = 'GIF';
					imgEl.loading = 'lazy';
					contentEl.appendChild(imgEl);
					continue;
				}

				if (segment.value) {
					contentEl.appendChild(document.createTextNode(segment.value));
				}
			}

			messageEl.appendChild(contentEl);

			if (timestamp) {
				const timeEl = document.createElement('time');
				timeEl.className = 'message-time';
				timeEl.textContent = timestamp;
				messageEl.appendChild(timeEl);
			}

			return messageEl;
		}

		function setGroupAuthor(group, author) {
			const existingAuthor = group.querySelector('.message-author');
			if (existingAuthor) {
				existingAuthor.remove();
			}

			if (!author) {
				return;
			}

			const authorEl = document.createElement('div');
			authorEl.className = 'message-author';
			authorEl.textContent = author;
			group.appendChild(authorEl);
		}

		function createMessageGroup(role, text, author, timestamp, segments) {
			const groupEl = document.createElement('div');
			groupEl.className = 'message-group ' + role;
			groupEl.dataset.role = role;
			groupEl.dataset.author = author || '';
			groupEl.appendChild(createMessageBubble(role, text, timestamp, segments));
			setGroupAuthor(groupEl, author);
			return groupEl;
		}

		function appendMessage(role, text, author, timestamp, segments) {
			const emptyState = document.getElementById('empty-state');
			if (emptyState) {
				emptyState.remove();
			}

			const lastGroup = getLastMessageGroup();
			if (isSameSender(lastGroup, role, author)) {
				const authorEl = lastGroup.querySelector('.message-author');
				const bubble = createMessageBubble(role, text, timestamp, segments);
				if (authorEl) {
					lastGroup.insertBefore(bubble, authorEl);
				} else {
					lastGroup.appendChild(bubble);
				}
				setGroupAuthor(lastGroup, author);
			} else {
				messagesEl.appendChild(createMessageGroup(role, text, author, timestamp, segments));
			}

			messagesEl.scrollTop = messagesEl.scrollHeight;
		}

		function clearMessages() {
			messagesEl.innerHTML = '';
			statusEl.textContent = '';
			statusEl.classList.remove('error');
			updateEmptyState(currentUser);
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

		signInEl.addEventListener('click', () => {
			vscode.postMessage({ type: 'signIn' });
		});

		signOutEl.addEventListener('click', () => {
			vscode.postMessage({ type: 'signOut' });
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

		vscode.postMessage({ type: 'ready' });

		window.addEventListener('message', (event) => {
			const message = event.data;
			switch (message.type) {
				case 'appendMessage':
					appendMessage(
						message.role,
						message.text,
						message.author,
						message.timestamp,
						message.segments
					);
					break;
				case 'setAuthState':
					setAuthState(message.signedIn, message.user);
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
