import { PermissionFlagsBits } from 'discord.js';
import { searchMember } from '../../utils/search.js';
import { parseDuration } from '../../utils/format.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';

export default {
  name: 'mute',

  async execute(client, message, user, duration) {
    if (
      !message.member.permissions.has(PermissionFlagsBits.MuteMembers)
    ) {
      return;
    }

    if (!user || !duration) {
      return await message.reply({
        embeds: [errorEmbed('Please provide a user and duration.')],
      });
    }

    const member = await searchMember(message.guild, user);
    const muteDuration = parseDuration(duration);

    if (!member) {
      return await message.reply({
        embeds: [errorEmbed('User not found.')],
      });
    }

    if (member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return await message.reply({
        embeds: [errorEmbed('You cannot mute a mod/admin.')],
      });
    }

    await member.timeout(
      muteDuration,
      `Muted by ${message.author.tag} for ${duration}`,
    );

    await message.reply({
      embeds: [
        successEmbed(`**${member.user.tag} has been muted.**`),
      ],
    });
  },
};
