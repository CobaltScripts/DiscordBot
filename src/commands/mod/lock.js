import { PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js'; 

/** Thank you oblongboot for this superb logic. */
export default {
  name: 'lock',

  /**
   * @param {import("../../client/bot.js").Bot} client
   * @param {import("discord.js").Message} message
   */
  async execute(client, message) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply({
        embeds: [errorEmbed("You don't have permission to manage channels.")],
        ephemeral: true
      });
    }

    const channel = message.channel;
    const everyoneRole = message.guild.roles.everyone;

    try {
      // check if its already locked
      const isLocked = channel.permissionOverwrites.cache
        .get(everyoneRole.id)
        ?.deny.has(PermissionFlagsBits.SendMessages);

      // instead of sending an API req for every single role, send 1 lmfao
      await channel.permissionOverwrites.edit(everyoneRole, {
        SendMessages: isLocked ? null : false,
      });
      
      await channel.send({
        embeds: [successEmbed(`**Channel ${isLocked ? 'unlocked' : 'locked'}!**`)],
      });
    } catch (err) {
      console.error(err);
      await message.reply({
        embeds: [errorEmbed("Something went wrong while toggling the lock.")],
      });
    }
  },
};
