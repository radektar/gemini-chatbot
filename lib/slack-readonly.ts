// Slack Read-Only Configuration
// Whitelist of read-only operations allowed from Slack API
// This ensures no write/update/delete operations can be performed
//
// NOTE: This file is in lib/ to avoid Next.js treating exports as server actions

/**
 * Slack Read-Only Security Layer
 * 
 * Ensures that Slack integration operates in read-only mode:
 * - Only public channels accessible
 * - No write operations allowed
 * - Optional whitelist for channel access control
 */

/**
 * Explicit whitelist of known read-only Slack API operations
 * Based on Slack Web API documentation
 */
export const SLACK_READ_ONLY_OPERATIONS = new Set([
  // Conversations (channels)
  'conversations.list',
  'conversations.history',
  'conversations.info',
  'conversations.members',
  'conversations.replies',
  'conversations.open',
  
  // Users
  'users.list',
  'users.info',
  'users.conversations',
  'users.getPresence',
  'users.profile.get',
  
  // Channels (deprecated, but may be used)
  'channels.list',
  'channels.history',
  'channels.info',
  'channels.members',
  
  // Search
  'search.messages',
  'search.files',
  'search.all',
  
  // Files (read-only)
  'files.info',
  'files.list',
  'files.sharedPublicURL',
  
  // Reactions (read-only)
  'reactions.get',
  'reactions.list',
  
  // Pins (read-only)
  'pins.list',
  
  // Reminders (read-only)
  'reminders.list',
  'reminders.info',
  
  // Team (read-only)
  'team.info',
  'team.accessLogs',
  'team.billableInfo',
  
  // Auth (read-only)
  'auth.test',
  
  // Generic read patterns (for compatibility)
  'get',
  'list',
  'read',
  'search',
  'fetch',
  'query',
  'retrieve',
  'info',
  'history',
]);

/**
 * Explicit blacklist of known write operations
 * These are NEVER allowed, even if they pass fuzzy matching
 */
export const SLACK_WRITE_OPERATIONS = new Set([
  // Chat operations
  'chat.postMessage',
  'chat.postEphemeral',
  'chat.update',
  'chat.delete',
  'chat.scheduleMessage',
  'chat.deleteScheduledMessage',
  'chat.meMessage',
  'chat.unfurl',
  'chat.getPermalink',
  
  // Files operations
  'files.upload',
  'files.delete',
  'files.comments.add',
  'files.comments.delete',
  'files.comments.edit',
  'files.remote.add',
  'files.remote.remove',
  'files.remote.info',
  'files.remote.list',
  'files.remote.share',
  'files.remote.update',
  
  // Channels operations
  'channels.create',
  'channels.archive',
  'channels.unarchive',
  'channels.join',
  'channels.leave',
  'channels.invite',
  'channels.kick',
  'channels.rename',
  'channels.setTopic',
  'channels.setPurpose',
  'channels.mark',
  
  // Conversations operations
  'conversations.create',
  'conversations.archive',
  'conversations.unarchive',
  'conversations.join',
  'conversations.leave',
  'conversations.invite',
  'conversations.kick',
  'conversations.rename',
  'conversations.setTopic',
  'conversations.setPurpose',
  'conversations.mark',
  'conversations.close',
  
  // Users operations
  'users.admin.invite',
  'users.admin.setInactive',
  'users.admin.setRegular',
  'users.admin.setOwner',
  'users.setActive',
  'users.setPresence',
  'users.setPhoto',
  'users.deletePhoto',
  'users.profile.set',
  
  // Pins operations
  'pins.add',
  'pins.remove',
  
  // Reactions operations
  'reactions.add',
  'reactions.remove',
  
  // Reminders operations
  'reminders.add',
  'reminders.complete',
  'reminders.delete',
  
  // Team operations
  'team.preferences.set',
  
  // Workflows
  'workflows.stepCompleted',
  'workflows.updateStep',
  
  // Admin operations
  'admin.apps.approve',
  'admin.apps.restrict',
  'admin.apps.requests.list',
  'admin.apps.requests.approve',
  'admin.apps.requests.cancel',
  'admin.conversations.restrictAccess',
  'admin.conversations.setTeams',
  'admin.conversations.whitelist',
  'admin.inviteRequests.approve',
  'admin.inviteRequests.deny',
  'admin.teams.create',
  'admin.teams.list',
  'admin.teams.settings.info',
  'admin.teams.settings.setDefaultChannels',
  'admin.teams.settings.setDescription',
  'admin.teams.settings.setIcon',
  'admin.teams.settings.setName',
  'admin.usergroups.addChannels',
  'admin.usergroups.addTeams',
  'admin.usergroups.removeChannels',
  'admin.usergroups.removeTeams',
  'admin.users.assign',
  'admin.users.invite',
  'admin.users.remove',
  'admin.users.session.reset',
  'admin.users.setAdmin',
  'admin.users.setExpiration',
  'admin.users.setOwner',
  'admin.users.setRegular',
]);

/**
 * Blacklist keywords for fuzzy matching
 * Operations containing these keywords are blocked
 */
const WRITE_KEYWORDS = [
  'post',
  'send',
  'create',
  'update',
  'delete',
  'remove',
  'archive',
  'unarchive',
  'join',
  'leave',
  'invite',
  'kick',
  'set',
  'rename',
  'add',
  'upload',
  'modify',
  'edit',
  'complete',
  'approve',
  'deny',
  'restrict',
  'assign',
  'reset',
];

export class SlackReadOnlyError extends Error {
  constructor(operation: string, reason: string) {
    super(`Slack read-only violation: ${operation} - ${reason}`);
    this.name = 'SlackReadOnlyError';
  }
}

export class SlackAccessDeniedError extends Error {
  constructor(channelId: string, reason: string) {
    super(`Access denied to Slack channel ${channelId}: ${reason}`);
    this.name = 'SlackAccessDeniedError';
  }
}

/**
 * Validates if a Slack API operation is allowed in read-only mode
 * @param operation - Slack API method name (e.g., 'conversations.history')
 * @throws SlackReadOnlyError if operation is not allowed
 */
export function validateSlackOperation(operation: string): void {
  // Normalize operation name
  const normalizedOp = operation.toLowerCase().trim();

  // 1. Check explicit blacklist (highest priority)
  if (SLACK_WRITE_OPERATIONS.has(normalizedOp)) {
    throw new SlackReadOnlyError(
      operation,
      'Operation is explicitly blacklisted as write operation'
    );
  }

  // 2. Check explicit whitelist
  if (SLACK_READ_ONLY_OPERATIONS.has(normalizedOp)) {
    return; // Allowed
  }

  // 3. Check blacklist keywords (fuzzy matching)
  const hasWriteKeyword = WRITE_KEYWORDS.some((keyword) =>
    normalizedOp.includes(keyword)
  );
  
  if (hasWriteKeyword) {
    throw new SlackReadOnlyError(
      operation,
      'Operation name contains write keyword (fuzzy match)'
    );
  }

  // 4. Check read patterns (allow get_, list_, read_, search_, fetch_, query_)
  const readPatterns = ['get', 'list', 'read', 'search', 'fetch', 'query', 'info', 'history'];
  const hasReadPattern = readPatterns.some((pattern) =>
    normalizedOp.includes(pattern)
  );

  if (hasReadPattern) {
    console.warn(`[Slack Read-Only] Allowing unknown operation with read pattern: ${operation}`);
    return; // Allowed with warning
  }

  // 5. Fail-safe: reject unknown operations by default
  throw new SlackReadOnlyError(
    operation,
    'Unknown operation rejected by fail-safe (not in whitelist)'
  );
}

/**
 * Validates if access to a specific channel is allowed
 * @param channelId - Slack channel ID
 * @param channelType - Type of channel ('public_channel', 'private_channel', 'im', 'mpim')
 * @throws SlackAccessDeniedError if access is not allowed
 */
export function validateChannelAccess(
  channelId: string,
  channelType?: string
): void {
  // 1. Block private channels, DMs, and group messages
  if (channelType) {
    if (channelType === 'private_channel') {
      throw new SlackAccessDeniedError(
        channelId,
        'Access to private channels is not allowed'
      );
    }
    if (channelType === 'im') {
      throw new SlackAccessDeniedError(
        channelId,
        'Access to direct messages (DM) is not allowed'
      );
    }
    if (channelType === 'mpim') {
      throw new SlackAccessDeniedError(
        channelId,
        'Access to multi-party instant messages (group DM) is not allowed'
      );
    }
  }

  // 2. Check whitelist if configured
  const allowedChannels = process.env.SLACK_ALLOWED_CHANNELS?.split(',').map(id => id.trim()) || [];
  
  if (allowedChannels.length > 0 && !allowedChannels.includes(channelId)) {
    throw new SlackAccessDeniedError(
      channelId,
      'Channel not in SLACK_ALLOWED_CHANNELS whitelist'
    );
  }

  // Allowed: public channel, optionally whitelisted
}

/**
 * Gets the list of allowed channel IDs from environment
 * @returns Array of allowed channel IDs, or empty array if no whitelist configured
 */
export function getAllowedChannels(): string[] {
  return process.env.SLACK_ALLOWED_CHANNELS?.split(',').map(id => id.trim()) || [];
}



