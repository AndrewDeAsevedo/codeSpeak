# codeChat

A VS Code sidebar chat extension backed by [PocketBase](https://pocketbase.io/). Sign in, send messages, and see everyone else's messages in a shared room.

## Features

- Sidebar chat panel in the Explorer view
- PocketBase authentication with saved sessions
- Shared message history loaded on sign-in
- Your messages on the right, everyone else's on the left
- Author names shown above each message

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run the extension

Press **F5** in VS Code to launch the Extension Development Host, then open the **codeChat** panel in the sidebar.

You can also focus the panel with **Cmd+Shift+C** (Mac) or **Ctrl+Shift+C** (Windows/Linux).

### 3. Sign in

Click **Sign In** in the chat panel, or run **codeChat: Sign In** from the Command Palette. Use your PocketBase username or email and password.

## PocketBase Setup

codeChat expects a PocketBase instance with a `users` auth collection and a `messages` collection.

### `messages` collection fields

| Field | Type | Notes |
|-------|------|-------|
| `text` | Plain text | Message body |
| `user` | Relation → `users` | Message author |

### API rules

Authenticated users must be able to create and list messages. In the PocketBase admin, set these rules on the `messages` collection:

| Rule | Value |
|------|-------|
| **List/Search** | `@request.auth.id != ""` |
| **View** | `@request.auth.id != ""` |
| **Create** | `@request.auth.id != ""` |

On the `users` collection, allow authenticated users to view records so author names can expand:

| Rule | Value |
|------|-------|
| **View** | `@request.auth.id != ""` |

If messages save but do not load, the **List/Search** rule is almost always the problem.

## Configuration

Set your PocketBase server URL using **one** of these (VS Code setting wins if both are set):

### Option A: `.env` (recommended for local dev)

```bash
cp .env.example .env
```

```env
POCKETBASE_URL=https://your-instance.pockethost.io/
```

`.env` is gitignored. Never put passwords or API keys in it — sign in through the extension instead.

### Option B: VS Code settings

```json
{
  "codechat.pocketbaseUrl": "https://your-instance.pockethost.io/"
}
```

| Setting | Description |
|---------|-------------|
| `codechat.pocketbaseUrl` | PocketBase server URL (overrides `.env`) |

## Commands

| Command | Description |
|---------|-------------|
| `codeChat: Focus codeChat` | Open the chat sidebar |
| `codeChat: Sign In` | Sign in to PocketBase |
| `codeChat: Sign Out` | Clear the saved session |
| `codeChat: Show Logs` | Open the codeChat output channel |

## Development

```bash
npm run compile   # Build TypeScript
npm run watch     # Watch mode
npm run lint      # ESLint
npm test          # Run tests in a VS Code test host
```

### Project structure

```
src/
  extension.ts           # Extension entry point
  chat/
    chatViewProvider.ts  # Sidebar webview and message flow
    pocketbaseClient.ts  # Auth and PocketBase client
    messageUtils.ts      # Message parsing helpers
    getChatHtml.ts       # Webview UI
    types.ts             # Webview message types
    logger.ts            # Output channel logging
  test/                  # Unit and integration tests
```

## License

MIT
