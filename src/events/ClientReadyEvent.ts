import { Event } from '@structures/Event.js';
import { ExtendedClient } from '@structures/Client.js';
import { Logger } from '@utils/Logger.js';
import { CommandManager } from '@structures/CommandManager.js';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TextChannel } from 'discord.js';
import cron from 'node-cron';
import Constants from '@utils/Constants.js';

export default class ClientReadyEvent extends Event<'clientReady'> {
  constructor() {
    super({
      name: 'clientReady',
      once: true,
    });
  }

  public async execute(client: ExtendedClient): Promise<void> {
    Logger.success(`Logged in as ${client.user?.tag}`);

    const commandsDirectory = join(dirname(fileURLToPath(import.meta.url)), '..', 'commands');
    const commandManager = new CommandManager(client);

    await commandManager.loadCommands(commandsDirectory);

    try {
      await commandManager.registerSlashCommands();
    } catch (error) {
      Logger.error(
        `Failed to register commands: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    client.commandManager = commandManager;
    client.smeeClient.start(client);
    client.updatePresence();

    cron.schedule('0 0 * * *', async () => {
      const channel = await client.channels.fetch(Constants.channels.qotd);

      if (!channel?.isTextBased()) {
        return;
      }

      const poll = await client.chatBot.generateQotdPoll();

      if (poll == null) {
        return;
      }

      await (channel as TextChannel).send({ poll });
      await (channel as TextChannel).send(`|| <@&${Constants.roles.qotd}> ||`);
    });
  }
}
