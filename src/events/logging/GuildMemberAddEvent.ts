import { Event } from '@structures/Event.js';
import { ExtendedClient } from '@structures/Client.js';
import { GuildMember } from 'discord.js';
import { getDataForGuild, GuildData } from '@data/DataStore.js';
import { Logger } from '@utils/Logger.js';
import { isErrorWithMessage } from '@utils/ErrorUtil.js';
import { buildGuildMemberLogEmbed, sendGuildMemberLogEmbed } from '../../utils/GuildMemberLog.js';

export default class GuildMemberAddEvent extends Event<'guildMemberAdd'> {
  constructor() {
    super({
      name: 'guildMemberAdd',
    });
  }

  public async execute(client: ExtendedClient, member: GuildMember): Promise<void> {
    const guild = member.guild;
    let data: GuildData;

    try {
      data = getDataForGuild(guild.id);
    } catch (error) {
      if (isErrorWithMessage(error)) {
        Logger.error(error.message);
      }

      return;
    }
    const embed = buildGuildMemberLogEmbed(
      member,
      'Member Joined',
      0x57f287,
      `${member.user.toString()} has joined the server.`
    );

    await sendGuildMemberLogEmbed(guild, data.channels.logging, embed);
    await member.roles.add(data.roles.community);

    client.updatePresence();
  }
}
