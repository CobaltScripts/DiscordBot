import { PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { searchMember } from '../../utils/search.js';

export default {
  name: 'ban',

  async execute(client, message, user) {
    if (
      !message.member.permissions.has(PermissionFlagsBits.BanMembers)
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

    if (member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return await message.reply({
        embeds: [errorEmbed('You cannot ban a mod/admin.')],
      });
    }

    await member.ban({ reason: `Banned by ${message.author.tag}` });

    await message.reply({
      embeds: [
        successEmbed(`**${member.user.tag} has been banned.**`),
      ],
    });
  },
};
