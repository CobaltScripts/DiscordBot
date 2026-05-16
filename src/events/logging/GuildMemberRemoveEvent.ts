import { Event } from '@structures/Event.js';
import { ExtendedClient } from '@structures/Client.js';
import { GuildMember } from 'discord.js';
import { buildGuildMemberLogEmbed } from '../../utils/GuildMemberLog.js';
import Constants from '@utils/Constants.js';

export default class GuildMemberRemoveEvent extends Event<'guildMemberRemove'> {
  constructor() {
    super({
      name: 'guildMemberRemove',
    });
  }

  public async execute(client: ExtendedClient, member: GuildMember): Promise<void> {
    const guild = member.guild;
    const embed = buildGuildMemberLogEmbed(
      member,
      'Member Left',
      0xed4245,
      `${member.user.toString()} has left the server.`
    );

    const channel = guild.channels.cache.get(Constants.channels.logging);

    if (!channel || !channel.isTextBased()) {
      return;
    }

    client.updatePresence();
    await channel.send({ embeds: [embed] });
  }
}
