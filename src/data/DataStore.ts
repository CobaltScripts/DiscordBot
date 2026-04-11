type ChannelTypes = 'logging' | 'commits' | 'errors';
type RoleTypes = 'updates' | 'qotd' | 'support' | 'community';
import * as fs from 'fs';
import { GUILD_SETTINGS_FILE } from '@data/Config.js';
import { CommandContext } from '@structures/Command.js';
import { validateGuildSettingsFile } from '../utils/JsonValidation.js';

export class GuildData {
  readonly guildId: string;
  channels: Record<ChannelTypes, string>;
  roles: Record<RoleTypes, string>;
  trusted: string[];

  constructor(guildId: string) {
    this.guildId = guildId;
    this.channels = {
      logging: '',
      commits: '',
      errors: '',
    };
    this.roles = {
      updates: '',
      qotd: '',
      support: '',
      community: '',
    };
    this.trusted = [];
  }

  toJson(): string {
    return JSON.stringify(
      {
        [this.guildId]: {
          channels: this.channels,
          roles: this.roles,
          trusted: this.trusted,
        },
      },
      null,
      2
    );
  }
}

export let dataStore: GuildData[] = loadFromJson(GUILD_SETTINGS_FILE);

function loadFromJson(jsonFilePath: string): GuildData[] {
  const fileContent = fs.readFileSync(jsonFilePath, 'utf-8');
  const data = JSON.parse(fileContent) as unknown;
  validateGuildSettingsFile(data, jsonFilePath);

  const values: GuildData[] = [];
  for (const guildId of Object.keys(data)) {
    const guildObj = data[guildId];
    const guildData = new GuildData(guildId);
    guildData.channels = guildObj.channels;
    guildData.roles = guildObj.roles;
    guildData.trusted = guildObj.trusted;
    values.push(guildData);
  }
  return values;
}

export function getDataFromContext(context: CommandContext): GuildData | undefined {
  if (!context.guild) {
    return undefined;
  }
  return getDataForGuild(context.guild.id);
}

export function getDataForGuild(guildId: string): GuildData | undefined {
  return dataStore.find((guild) => guild.guildId === guildId);
}
