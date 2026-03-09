import { errorEmbed } from '../utils/embeds.js';
import { logger } from '../utils/logger.js';

export default {
  name: 'messageCreate',

  async execute(client, message) {
    if (message.author.bot) return;
    if (!message.content.startsWith(client.prefix)) return;

    const args = message.content
      .slice(client.prefix.length)
      .trim()
      .split(/ +/);

    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName);

    if (!command) {
      return;
    }

    try {
      await command.execute(client, message, ...args);
    } catch (error) {
      logger.error(
        `Error executing command ${commandName}: ${error.message}`,
      );

      await message.reply({
        embeds: [
          errorEmbed('There was an error executing that command.'),
        ],
      });
    }
  },
};
