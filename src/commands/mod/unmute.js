import { PermissionFlagsBits } from 'discord.js';
import { searchMember } from '../../utils/search.js';
import { errorEmbed, successEmbed } from '../../utils/embeds.js';

export default {
  name: 'unmute',

  async execute(client, message, user) {
    if (
      !message.member.permissions.has(PermissionFlagsBits.MuteMembers)
    ) {
      return;
    }

    if (!user) {
      return;
    }

    const member = await searchMember(message.guild, user);

    if (!member) {
      return await message.reply({
        embeds: [errorEmbed('User not found.')],
      });
    }

    if (member.communicationDisabledUntilTimestamp < Date.now()) {
      return await message.reply({
        embeds: [errorEmbed(`**${member.user.tag} is not muted.**`)],
      });
    }

    await member.timeout(null);

    await message.reply({
      embeds: [
        successEmbed(`**${member.user.tag} has been unmuted.**`),
      ],
    });
  },
};
