import { PermissionFlagsBits } from 'discord.js';
import { successEmbed } from '../../utils/embeds.js';

export default {
  name: 'clear',

  /**
   * @param {import("../../client/bot.js").Bot} client
   * @param {import("discord.js").Message} message
   */
  async execute(client, message, amount) {
    if (
      !message.member.permissions.has(
        PermissionFlagsBits.ManageMessages,
      )
    ) {
      return;
    }

    if (!amount || isNaN(amount) || amount < 1 || amount > 100) {
      return await message.reply({
        embeds: [errorEmbed("Please provide a valid number of messages to delete (1-100).")],
      });
    }

    await message.delete();
    await message.channel.bulkDelete(amount, true);

    const msg = await message.channel.send({
      embeds: [successEmbed(`**Deleted ${amount} messages.**`)],
    });

    setTimeout(() => msg.delete(), 3000);
  },
};
