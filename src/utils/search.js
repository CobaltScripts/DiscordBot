export const searchMember = async (guild, query) => {
  const mentionRegex = /^<@!?(\d+)>$/;
  const mentionMatch = query.match(mentionRegex);
  const id = mentionMatch ? mentionMatch[1] : null;

  if (id || /^\d+$/.test(query)) {
    const userId = id || query;
    const cached = guild.members.cache.get(userId);
    if (cached) return cached;
    try {
      return await guild.members.fetch(userId);
    } catch {
      return null;
    }
  }

  const normalized = query.toLowerCase();

  const exact = guild.members.cache.find((member) => {
    const display = member.displayName.toLowerCase();
    const user = member.user.username.toLowerCase();
    const global = member.user.globalName?.toLowerCase();
    return (
      display === normalized ||
      user === normalized ||
      global === normalized
    );
  });
  if (exact) return exact;

  const partial = guild.members.cache.find((member) => {
    const display = member.displayName.toLowerCase();
    const user = member.user.username.toLowerCase();
    const global = member.user.globalName?.toLowerCase();
    return (
      display.includes(normalized) ||
      user.includes(normalized) ||
      (global && global.includes(normalized))
    );
  });

  return partial || null;
};

export const searchRole = async (guild, query) => {
  const mentionRegex = /^<@&(\d+)>$/;
  const mentionMatch = query.match(mentionRegex);
  const roleIdFromMention = mentionMatch ? mentionMatch[1] : null;
  const normalized = query.toLowerCase();

  const roles = guild.roles.cache.size
    ? guild.roles.cache
    : await guild.roles.fetch();

  for (const role of roles.values()) {
    const name = role.name.toLowerCase();
    if (
      name === normalized ||
      name.includes(normalized) ||
      role.id === query ||
      role.id === roleIdFromMention
    ) {
      return role;
    }
  }

  return null;
};

export const searchChannel = async (guild, query) => {
  if (!guild || !query) return null;

  const mentionRegex = /^<#(\d+)>$/;
  const mentionMatch = query.match(mentionRegex);
  const channelIdFromMention = mentionMatch ? mentionMatch[1] : null;

  const normalized = query.toLowerCase();

  const channels = guild.channels.cache.size
    ? guild.channels.cache
    : await guild.channels.fetch();

  for (const channel of channels.values()) {
    const name = channel.name.toLowerCase();

    if (
      name === normalized ||
      name.includes(normalized) ||
      channel.id === query ||
      channel.id === channelIdFromMention
    ) {
      return channel;
    }
  }

  return null;
};
