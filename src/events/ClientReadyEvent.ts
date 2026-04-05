import { Event } from '../structures/Event.js';
import { ExtendedClient } from '../structures/Client.js';
import { Logger } from '../utils/Logger.js';
import { ActivityType } from 'discord.js';

export default class ClientReadyEvent extends Event<'clientReady'> {
  constructor() {
    super({
      name: 'clientReady',
      once: true,
    });
  }

  public execute(client: ExtendedClient): void {
    Logger.success(`Logged in as ${client.user?.tag}`);

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
