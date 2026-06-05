# Studio Chat

Team chat in the VS Code sidebar, backed by your own [PocketBase](https://pocketbase.io/) server. Sign in, send messages, and see everyone else's messages in a shared room.

## Features

- Sidebar chat panel in the Explorer view
- PocketBase sign-in with sessions saved securely in VS Code Secret Storage
- Shared message history loaded on sign-in
- New messages sync via PocketBase realtime and polling (every 5 seconds by default)
- Your messages on the right, everyone else's on the left
- Author names on message groups

## Quick start

1. Install **Studio Chat** from the Marketplace (or from a VSIX).
2. Open the **Studio Chat** panel in the sidebar, or press **Cmd+Shift+C** (Mac) / **Ctrl+Shift+C** (Windows/Linux).
3. Click **Sign In** (or run **Studio Chat: Sign In** from the Command Palette).

On first sign-in you will be prompted for:

1. **PocketBase server URL** — the URL your team admin gave you (e.g. `https://your-server.example`)
2. **Sync interval** — how often to poll for new messages in seconds (`0` = realtime only)
3. **Username or email** and **password** for your PocketBase account

Settings from step 1–2 are saved to your VS Code user settings. Credentials are never written to settings files.

## Security

**Do not commit or share:**

- PocketBase server URLs in public repos, screenshots, or chat unless your team intends them to be public
- Usernames, passwords, or auth tokens
- `.env` files used for local development

**How Studio Chat stores data:**

| Data | Where it goes |
|------|----------------|
| PocketBase URL | VS Code user settings (`codechat.pocketbaseUrl`) |
| Sync interval | VS Code user settings (`codechat.syncIntervalSeconds`) |
| Auth session | VS Code Secret Storage (encrypted by the editor) |

Sign in through the extension UI — do not put passwords in `settings.json`, `.env`, or the README.

## Configuration (optional)

Most users only need the first-time sign-in prompts. You can also set these in VS Code settings:

| Setting | Description |
|---------|-------------|
| `codechat.pocketbaseUrl` | PocketBase server URL |
| `codechat.syncIntervalSeconds` | Poll interval in seconds (default `5`; `0` = realtime only) |

Example (use your team's URL, not a shared demo value):

```json
{
  "codechat.pocketbaseUrl": "https://your-server.example",
  "codechat.syncIntervalSeconds": 5
}
```

## Commands

| Command | Description |
|---------|-------------|
| `Studio Chat: Focus Studio Chat` | Open the chat sidebar |
| `Studio Chat: Sign In` | Sign in to PocketBase |
| `Studio Chat: Sign Out` | Clear the saved session |
| `Studio Chat: Show Logs` | Open the Studio Chat output channel |

## PocketBase setup (server admins)

Studio Chat expects a PocketBase instance with a `users` auth collection and a `messages` collection.

### `messages` collection fields

| Field | Type | Notes |
|-------|------|-------|
| `text` | Plain text | Message body |
| `user` | Relation → `users` | Message author |

### API rules

Set these on the `messages` collection:

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

## Development

For local extension development only:

```bash
npm install
npm run compile
```

Press **F5** to launch the Extension Development Host. You may copy `.env.example` to `.env` and set `POCKETBASE_URL` for local runs — `.env` is gitignored and is **not** included in the published VSIX.

```bash
npm run watch     # Watch mode
npm run lint      # ESLint
npm test          # Run tests
```

## License

MIT
