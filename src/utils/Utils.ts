import type { Guild } from 'discord.js';

const MEMBER_MENTION_REGEX = /^<@!?(\d+)>$/;
const ROLE_MENTION_REGEX = /^<@&(\d+)>$/;
const CHANNEL_MENTION_REGEX = /^<#(\d+)>$/;
const DISCORD_ID_REGEX = /^\d+$/;

const normalize = (value: string): string => value.trim().toLowerCase();

const matchesExactOrPartial = (
  normalizedQuery: string,
  ...values: Array<string | null | undefined>
): boolean => {
  const safeValues = values.filter((value): value is string => Boolean(value));
  return safeValues.some((value) => {
    const normalizedValue = value.toLowerCase();
    return normalizedValue === normalizedQuery || normalizedValue.includes(normalizedQuery);
  });
};

export class Utils {
  public static async findMember(guild: Guild, query: string): Promise<string | null> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return null;
    }

    const mentionMatch = trimmedQuery.match(MEMBER_MENTION_REGEX);
    const userId = mentionMatch?.[1] ?? (DISCORD_ID_REGEX.test(trimmedQuery) ? trimmedQuery : null);

    if (userId) {
      const cachedMember = guild.members.cache.get(userId);

      if (cachedMember) {
        return cachedMember.id;
      }

      try {
        const member = await guild.members.fetch(userId);
        return member.id;
      } catch {
        return null;
      }
    }

    const normalizedQuery = normalize(trimmedQuery);
    const partialMember = guild.members.cache.find((member) =>
      matchesExactOrPartial(
        normalizedQuery,
        member.displayName,
        member.user.username,
        member.user.globalName
      )
    );

    if (partialMember) {
      return partialMember.id;
    }

    try {
      const searchedMembers = await guild.members.search({ query: trimmedQuery, limit: 10 });

      const exactSearchedMember = searchedMembers.find((member) =>
        matchesExactOrPartial(
          normalizedQuery,
          member.displayName,
          member.user.username,
          member.user.globalName
        )
      );

      if (exactSearchedMember) {
        return exactSearchedMember.id;
      }

      return searchedMembers.first()?.id ?? null;
    } catch {
      return null;
    }
  }

  public static async findRole(guild: Guild, query: string): Promise<string | null> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return null;
    }

    const mentionRoleId = trimmedQuery.match(ROLE_MENTION_REGEX)?.[1] ?? null;
    const normalizedQuery = normalize(trimmedQuery);

    const roles = guild.roles.cache.size > 0 ? guild.roles.cache : await guild.roles.fetch();

    for (const role of roles.values()) {
      if (!role) {
        continue;
      }

      if (
        matchesExactOrPartial(normalizedQuery, role.name) ||
        role.id === trimmedQuery ||
        role.id === mentionRoleId
      ) {
        return role.id;
      }
    }

    return null;
  }

  public static async findChannel(guild: Guild, query: string): Promise<string | null> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return null;
    }

    const mentionChannelId = trimmedQuery.match(CHANNEL_MENTION_REGEX)?.[1] ?? null;
    const normalizedQuery = normalize(trimmedQuery);

    const channels =
      guild.channels.cache.size > 0 ? guild.channels.cache : await guild.channels.fetch();

    for (const channel of channels.values()) {
      if (!channel) {
        continue;
      }

      if (
        matchesExactOrPartial(normalizedQuery, channel.name) ||
        channel.id === trimmedQuery ||
        channel.id === mentionChannelId
      ) {
        return channel.id;
      }
    }

    return null;
  }
}
