import { EmbedBuilder, Guild, GuildMember } from 'discord.js';

export function buildGuildMemberLogEmbed(
  member: GuildMember,
  title: string,
  color: number,
  description: string
): EmbedBuilder {
  const avatarUrl = member.user.displayAvatarURL({ size: 256 });
  const createdAt = `<t:${Math.floor(member.user.createdAt.getTime() / 1000)}:R>`;
  const joinedAt = member.joinedAt
    ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>`
    : 'Unknown';

  return new EmbedBuilder()
    .setTitle(title)
    .setColor(color)
    .setThumbnail(avatarUrl)
    .setDescription(description)
    .addFields(
      { name: 'Display Name', value: member.displayName || member.user.username, inline: true },
      { name: 'Account Created', value: createdAt, inline: true },
      { name: 'Joined Server', value: joinedAt, inline: false }
    )
    .setFooter({ text: `User ID: ${member.user.id}` })
    .setTimestamp();
}

export async function sendGuildMemberLogEmbed(
  guild: Guild,
  channelId: string,
  embed: EmbedBuilder
): Promise<void> {
  const channel = guild.channels.cache.get(channelId);

  if (!channel || !channel.isTextBased()) {
    return;
  }

  await channel.send({ embeds: [embed] });
}
