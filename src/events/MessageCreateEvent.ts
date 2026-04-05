import { Event } from '../structures/Event.js';
import { ExtendedClient } from '../structures/Client.js';
import { Message } from 'discord.js';
import { Logger } from '../utils/Logger.js';

export default class MessageCreateEvent extends Event<'messageCreate'> {
  constructor() {
    super({
      name: 'messageCreate',
    });
  }

  public async execute(client: ExtendedClient, message: Message): Promise<void> {
    if (message.author.bot) return;
    if (!message.content.startsWith(client.prefix)) return;

    const args = message.content.slice(client.prefix.length).trim().split(/\s+/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

    const command = client.commandManager?.getCommand(commandName);

    if (!command) {
      Logger.warn(`Chat command not found: ${commandName}`);
      await message.reply('This command does not exist.');
      return;
    }

    try {
      const parsedArgs = command.parseChatArgs(args);

      const context = command.createContext(client, parsedArgs, undefined, message);
      await command.execute(context);
    } catch (error) {
      Logger.error(
        `Error executing chat command ${commandName}: ${error instanceof Error ? error.message : String(error)}`
      );
      await message.reply(
        `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
