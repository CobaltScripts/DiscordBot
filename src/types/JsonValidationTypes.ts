export type ChannelTypes = 'logging' | 'commits' | 'errors';

export type RoleTypes = 'updates' | 'qotd' | 'support' | 'community';

export type GuildSettingsFile = Record<
  string,
  {
    channels: Record<ChannelTypes, string>;
    roles: Record<RoleTypes, string>;
    trusted: string[];
  }
>;
