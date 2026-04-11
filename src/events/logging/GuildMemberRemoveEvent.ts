import { Event } from '@structures/Event.js';
import { ExtendedClient } from '@structures/Client.js';
import { EmbedBuilder, GuildMember } from 'discord.js';

export default class GuildMemberRemoveEvent extends Event<'guildMemberRemove'> {
  constructor() {
    super({
      name: 'guildMemberRemove',
    });
  }

  public async execute(client: ExtendedClient, member: GuildMember): Promise<void> {
    const guild = member.guild;

    if (guild.id !== Constants.GUILD_ID) {
      return;
    }

    const loggingChannel = guild.channels.cache.get(Constants.CHANNELS.LOGGING_CHANNEL);

    if (!loggingChannel || !loggingChannel.isTextBased()) {
      return;
    }

    const avatarUrl = member.user.displayAvatarURL({ size: 256 });
    const createdAt = `<t:${Math.floor(member.user.createdAt.getTime() / 1000)}:R>`;
    const joinedAt = member.joinedAt
      ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>`
      : 'Unknown';

    const embed = new EmbedBuilder()
      .setTitle('Member Left')
      .setColor(0xed4245)
      .setThumbnail(avatarUrl)
      .setDescription(`${member.user.toString()} has left the server.`)
      .addFields(
        { name: 'Display Name', value: member.displayName || member.user.username, inline: true },
        { name: 'Account Created', value: createdAt, inline: true },
        { name: 'Joined Server', value: joinedAt, inline: false }
      )
      .setFooter({ text: `User ID: ${member.user.id}` })
      .setTimestamp();

    await loggingChannel.send({ embeds: [embed] });

    client.updatePresence();
  }
}
