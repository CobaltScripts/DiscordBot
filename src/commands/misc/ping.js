import { mainEmbed } from '../../utils/embeds.js';

export default {
  name: 'ping',

  async execute(client, message) {
    const embed = mainEmbed('Pong!');

    await message.reply({
      embeds: [embed],
      allowedMentions: { repliedUser: false },
    });
  },
};
