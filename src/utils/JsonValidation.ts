import { RuntimeError } from '../errors/RuntimeError.js';
import type { GuildSettingsFile } from '../types/JsonValidationTypes.js';

export function validateGuildSettingsFile(
  data: unknown,
  jsonFilePath: string
): asserts data is GuildSettingsFile {
  if (!isRecord(data)) {
    throw new RuntimeError(
      `Invalid guild settings in ${jsonFilePath}: root value must be an object.`
    );
  }

  for (const [guildId, guildData] of Object.entries(data)) {
    if (!isRecord(guildData)) {
      throw new RuntimeError(
        `Invalid guild settings in ${jsonFilePath}: guild ${guildId} must be an object.`
      );
    }

    assertExactKeys(guildData, ['channels', 'roles', 'trusted'], `guild ${guildId}`);

    if (!isRecord(guildData.channels)) {
      throw new RuntimeError(
        `Invalid guild settings in ${jsonFilePath}: guild ${guildId}.channels must be an object.`
      );
    }

    if (!isRecord(guildData.roles)) {
      throw new RuntimeError(
        `Invalid guild settings in ${jsonFilePath}: guild ${guildId}.roles must be an object.`
      );
    }

    assertExactKeys(
      guildData.channels,
      ['logging', 'commits', 'errors'],
      `guild ${guildId}.channels`
    );
    assertExactKeys(
      guildData.roles,
      ['updates', 'qotd', 'support', 'community'],
      `guild ${guildId}.roles`
    );

    for (const [key, value] of Object.entries(guildData.channels)) {
      if (typeof value !== 'string') {
        throw new RuntimeError(
          `Invalid guild settings in ${jsonFilePath}: guild ${guildId}.channels.${key} must be a string.`
        );
      }
    }

    for (const [key, value] of Object.entries(guildData.roles)) {
      if (typeof value !== 'string') {
        throw new RuntimeError(
          `Invalid guild settings in ${jsonFilePath}: guild ${guildId}.roles.${key} must be a string.`
        );
      }
    }

    if (
      !Array.isArray(guildData.trusted) ||
      !guildData.trusted.every((entry) => typeof entry === 'string')
    ) {
      throw new RuntimeError(
        `Invalid guild settings in ${jsonFilePath}: guild ${guildId}.trusted must be an array of strings.`
      );
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertExactKeys(
  value: Record<string, unknown>,
  expectedKeys: string[],
  label: string
): void {
  const actualKeys = Object.keys(value).sort();
  const sortedExpectedKeys = [...expectedKeys].sort();

  if (actualKeys.length !== sortedExpectedKeys.length) {
    throw new RuntimeError(
      `Invalid guild settings: ${label} must contain exactly ${sortedExpectedKeys.join(', ')}.`
    );
  }

  for (let index = 0; index < sortedExpectedKeys.length; index += 1) {
    if (actualKeys[index] !== sortedExpectedKeys[index]) {
      throw new RuntimeError(
        `Invalid guild settings: ${label} must contain exactly ${sortedExpectedKeys.join(', ')}.`
      );
    }
  }
}
