# Slack Integration Security

## Security Model

Impact Chad's Slack integration operates in **read-only mode** with the following security guarantees:

### Access Control

#### ✅ ALLOWED:
- **Public channels only** - Bot can access all public channels in the workspace
- **Channel history** - Read messages from public channels
- **Channel list** - List all public channels
- **User info** - Read basic user information (for message attribution)

#### ❌ FORBIDDEN:
- **Private channels** - No access to private/invite-only channels
- **Direct messages (DM)** - No access to 1-on-1 conversations
- **Group messages (mpim)** - No access to private group conversations
- **Write operations** - No posting, updating, or deleting messages
- **Administrative operations** - No channel creation, user management, etc.

### Why Public Channels Only?

Public channels in Slack are designed to be accessible to all workspace members. Any user can:
- View the list of public channels
- Join any public channel
- Read message history after joining

The chatbot acts as a search assistant for **publicly available information** in the workspace. This aligns with Slack's security model for public channels.

### Optional Whitelist

For additional control, you can configure a whitelist of specific public channels:

```bash
# .env.local
SLACK_ALLOWED_CHANNELS=C01234567,C76543210,C89ABCDEF
```

When configured:
- Only whitelisted channels are accessible
- Other public channels are blocked
- Useful for limiting scope to specific teams/projects

When not configured:
- All public channels are accessible (default)

## Required Slack Scopes

The Slack bot token requires these **minimal scopes**:

### Required:
- `channels:read` - List public channels
- `channels:history` - Read messages from public channels

### Optional (for extended functionality):
- `users:read` - Read user profile information
- `users:read.email` - Read user email addresses (if needed)

### NOT Required (and should NOT be granted):
- ❌ `chat:write` - Post messages (write operation)
- ❌ `channels:write` - Manage channels (write operation)
- ❌ `groups:read` - Read private channels (privacy violation)
- ❌ `im:read` - Read direct messages (privacy violation)
- ❌ `mpim:read` - Read group messages (privacy violation)

## Setup Instructions

### 1. Create Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click **Create New App** → **From scratch**
3. Enter App Name: "Impact Chad" (or your preferred name)
4. Select your workspace
5. Click **Create App**

### 2. Configure OAuth Scopes

1. Navigate to **OAuth & Permissions**
2. Scroll to **Bot Token Scopes**
3. Add **only** these scopes:
   - `channels:read`
   - `channels:history`
   - `users:read` (optional)
4. Click **Save Changes**

### 3. Install App to Workspace

1. Scroll to **OAuth Tokens for Your Workspace**
2. Click **Install to Workspace**
3. Review permissions and click **Allow**
4. Copy the **Bot User OAuth Token** (starts with `xoxb-`)

### 4. Configure Environment Variable

Add to `.env.local`:

```bash
SLACK_BOT_TOKEN=xoxb-your-token-here
```

### 5. Invite Bot to Public Channels

The bot needs to be a member of channels to read their history:

1. Open a public channel in Slack
2. Type `/invite @Impact Chad` (or your bot name)
3. Repeat for all channels you want the bot to access

**Note:** The bot can only read history from channels where it's a member.

## Security Layers

The integration implements **three layers** of protection:

### Layer 1: Minimal Scopes
Bot token has only read permissions for public channels at the Slack API level.

### Layer 2: Application-Level Validation
`lib/slack-readonly.ts` validates all operations:
- Explicit whitelist of read-only operations
- Explicit blacklist of write operations
- Fail-safe: unknown operations blocked by default

### Layer 3: Channel Type Filtering
`integrations/slack/client.ts` filters channels:
- Only `public_channel` type
- Blocks `private_channel`, `im`, `mpim`
- Optional whitelist enforcement

## Testing

Run security tests:

```bash
npx tsx tests/slack-readonly.test.ts
```

Expected results:
- ✅ Read operations allowed (conversations.list, conversations.history)
- ✅ Write operations blocked (chat.postMessage, files.upload)
- ✅ Private channels blocked
- ✅ DM/group messages blocked
- ✅ Unknown operations blocked (fail-safe)

## Audit Logging

All Slack API operations are logged for security monitoring:

```
[Slack Audit] 2025-12-22T10:30:45.123Z | Operation: getChannelHistory | Channel: C01234567 | Limit: 200
```

Logs include:
- Timestamp (ISO 8601)
- Operation name
- Channel ID
- Request parameters

**Security Note:** Logs never contain:
- Message content
- User personal data
- Bot tokens or secrets

## Troubleshooting

### "SLACK_BOT_TOKEN is not configured"
Add `SLACK_BOT_TOKEN` to `.env.local` with your bot token.

### "Failed to fetch channels"
- Verify bot token is valid
- Check bot has required scopes (`channels:read`)
- Ensure bot is installed in workspace

### "Channel not in SLACK_ALLOWED_CHANNELS whitelist"
- Add channel ID to whitelist in `.env.local`
- Or remove `SLACK_ALLOWED_CHANNELS` to allow all public channels

### Bot can't read channel history
- Invite bot to the channel: `/invite @BotName`
- Bot must be a member to read history

## Privacy Considerations

### What data is synced?
- Channel names and IDs
- Message text, timestamps, and author IDs
- No file attachments or media

### Where is data stored?
- Locally in `data/slack/` directory (JSON files)
- Per-channel files: `{channelId}.json`
- Not sent to external services

### Data retention
- Messages persist until manually deleted
- No automatic expiration
- Follows Slack workspace retention policies

### User privacy
- Only public channel messages
- User IDs (not personal data) are stored
- No access to DMs or private conversations

## Production Checklist

Before deploying to production:

- [ ] Slack bot token configured
- [ ] Bot has minimal scopes only (`channels:read`, `channels:history`)
- [ ] Bot invited to required channels
- [ ] Optional: Whitelist configured (`SLACK_ALLOWED_CHANNELS`)
- [ ] Security tests passing (`npx tsx tests/slack-readonly.test.ts`)
- [ ] Audit logging verified in production logs
- [ ] Privacy policy updated to mention Slack data access
- [ ] Users informed about chatbot's access to public channels



