/**
 * Searches for a member over time, not after downloading full member list
 * This avoids fetching the entire member list.
 * @param {import("discord.js").Guild} guild The guild to search in.
 * @param {string} query The user ID, mention, or name to search for.
 * @returns {Promise<import("discord.js").GuildMember|null>}
 */
export const searchMember = async (guild, query) => {
  if (!guild || !query) return null;

  const mentionMatch = query.match(/^<@!?(\d+)>$/);
  if (mentionMatch) {
    const userId = mentionMatch[1];
    try {
      return await guild.members.fetch(userId);
    } catch (e) {
      return null;
    }
  }

  if (/^\d{17,19}$/.test(query)) {
    try {
      return await guild.members.fetch(query);
    } catch (e) {
      return null;
    }
  }

  try {
    const results = await guild.members.fetch({ query, limit: 1 });
    return results.first() || null; 
  } catch (e) {
    console.error("Failed to search for member:", e);
    return null;
  }
};

/**
 * Parse a duration string (e.g., "10m", "2h") into milliseconds.
 * Supports seconds (s), minutes (m), hours (h), and days (d).
 * @param {string} duration - The duration string to parse.
 * @returns {number} - The duration in milliseconds, or null if invalid.
 */
export const parseDuration = (duration) => {
  const match = duration.match(/(\d+)([smhd])/);
  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 1000 * 60;
    case 'h':
      return value * 1000 * 60 * 60;
    case 'd':
      return value * 1000 * 60 * 60 * 24;
    default:
      return 1000 * 60; // Default to 1 minute
  }
};
