import { EmbedBuilder } from 'discord.js';
import constants from '../../utils/constants.js';

export default {
  name: 'guildMemberAdd',

  async execute(client, member) {
    const channel = client.channels.cache.get(
      constants.MODLOGS_CHANNEL,
    );

    if (!channel) return;

    const avatarUrl = member.user.displayAvatarURL({ size: 256 });
    const createdAt = `<t:${Math.floor(member.user.createdAt.getTime() / 1000)}:R>`;
    const joinedAt = member.joinedAt
      ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>`
      : 'Unknown';

    const embed = new EmbedBuilder()
      .setTitle('Member Joined')
      .setColor(0x57f287)
      .setThumbnail(avatarUrl)
      .setDescription(`${member.user.toString()} has joined the server.`)
      .addFields(
        { name: 'Display Name', value: member.displayName || member.user.username, inline: true },
        { name: 'Account Created', value: createdAt, inline: true },
        { name: 'Joined Server', value: joinedAt, inline: false },
      )
      .setFooter({ text: `User ID: ${member.user.id}` })
      .setTimestamp();

    await channel.send({ embeds: [embed] });

    await member.roles.add(constants.ROLES.COMMUNITY);
  },
};
