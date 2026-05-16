import { Event } from '@structures/Event.js';
import { ExtendedClient } from '@structures/Client.js';
import { GuildMember } from 'discord.js';
import { buildGuildMemberLogEmbed } from '../../utils/GuildMemberLog.js';
import Constants from '@utils/Constants.js';

export default class GuildMemberAddEvent extends Event<'guildMemberAdd'> {
  constructor() {
    super({
      name: 'guildMemberAdd',
    });
  }

  public async execute(client: ExtendedClient, member: GuildMember): Promise<void> {
    const guild = member.guild;
    const embed = buildGuildMemberLogEmbed(
      member,
      'Member Joined',
      0x57f287,
      `${member.user.toString()} has joined the server.`
    );

    const channel = guild.channels.cache.get(Constants.channels.logging);

    if (!channel || !channel.isTextBased()) {
      return;
    }

    client.updatePresence();
    await member.roles.add(Constants.roles.community);
    await channel.send({ embeds: [embed] });
  }
}
