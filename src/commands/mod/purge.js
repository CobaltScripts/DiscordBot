import { PermissionFlagsBits } from 'discord.js';
import { logger } from '../../utils/logger.js';
import { successEmbed } from '../../utils/embeds.js';

export default {
  name: 'purge',

  async execute(client, message) {
    if (
      !message.member.permissions.has(
        PermissionFlagsBits.Administrator,
      )
    ) {
      return;
    }

    const originalChannel = message.channel;

    try {
      const channel = await originalChannel.clone({
        name: originalChannel.name,
        topic: originalChannel.topic,
        nsfw: originalChannel.nsfw,
        permissionOverwrites:
          originalChannel.permissionOverwrites.cache,
      });

      if (originalChannel.parentId) {
        await channel.setParent(originalChannel.parentId, {
          lockPermissions: false,
        });
      }

      await channel.setPosition(originalChannel.position);
      await originalChannel.delete(`Purged by ${message.author.tag}`);

      await channel.send({
        embeds: [
          successEmbed(`**Channel purged by ${message.author.tag}**`),
        ],
      });
    } catch (error) {
      logger.error(`Error during purge command: ${error}`);

      await message.reply(
        'An error occurred while trying to purge channel.',
      );
    }
  },
};
