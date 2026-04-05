import { Event } from '../structures/Event.js';
import { ExtendedClient } from '../structures/Client.js';
import { Logger } from '../utils/Logger.js';
import { ActivityType } from 'discord.js';
import { CommandManager } from '../structures/CommandManager.js';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
    const commandManager = new CommandManager(client, '1325571365079879774'); // Cobalt Guild ID

    await commandManager.loadCommands(commandsDirectory);

    try {
      await commandManager.registerSlashCommands();
    } catch (error) {
      Logger.error(
        `Failed to register commands: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    client.commandManager = commandManager;

    const cobaltGuild = client.guilds.cache.find((guild) => {
      return guild.id == '1325571365079879774'; // Cobalt Guild ID
    });

    client.user?.setPresence({
      status: 'dnd',
      activities: [
        {
          name: `${cobaltGuild?.memberCount} members`,
          type: ActivityType.Watching,
        },
      ],
    });
  }
}
