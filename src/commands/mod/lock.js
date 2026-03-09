import { PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';

export default {
  name: 'lock',

  async execute(client, message) {
    if (
      !message.member.permissions.has(
        PermissionFlagsBits.ManageChannels,
      )
    ) {
      return;
    }

    const channel = message.channel;

    try {
      const everyoneRole = message.guild.roles.everyone;
      const isLocked = channel.permissionOverwrites.cache
        .get(everyoneRole.id)
        ?.deny.has(PermissionFlagsBits.SendMessages);

      await channel.permissionOverwrites.edit(everyoneRole, {
        SendMessages: isLocked ? null : false,
      });

      await message.reply({
        embeds: [
          successEmbed(
            `**Channel ${isLocked ? 'unlocked' : 'locked'}!**`,
          ),
        ],
      });
    } catch (err) {
      console.log(err);

      await message.reply({
        embeds: [
          errorEmbed('Something went wrong while toggling the lock.'),
        ],
      });
    }
  },
};
