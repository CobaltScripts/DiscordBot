import {
  ActivityOptions,
  ActivityType,
  Client,
  GatewayIntentBits,
  Partials,
  TextChannel,
} from 'discord.js';
import { readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Event } from '@structures/Event.js';
import { CommandManager } from '@structures/CommandManager.js';
import { SmeeClient } from '@utils/SmeeClient.js';
import { ChatBot } from '@utils/ChatBot.js';
import { Embeds } from '@utils/Embeds.js';
import { Logger } from '@utils/Logger.js';
import { COBALT_GUILD_ID } from '@data/Config.js';
import { dataStore } from '@data/DataStore.js';

export interface ExtendedClientOptions {
  token: string;
  smeeUrl: string;
  mistralApiKey: string;
  prefix: string;
}

export class ExtendedClient extends Client {
  public readonly prefix: string;
  public readonly smeeClient: SmeeClient;
  public readonly chatBot: ChatBot;
  public commandManager: CommandManager | null = null;

  constructor(extendedClientOptions: ExtendedClientOptions) {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
      ],
      partials: [
        Partials.Channel,
        Partials.GuildMember,
        Partials.Message,
        Partials.User,
        Partials.Reaction,
      ],
    });

    this.prefix = extendedClientOptions.prefix;
    this.chatBot = new ChatBot(this, extendedClientOptions.mistralApiKey);
    this.smeeClient = new SmeeClient({
      source: extendedClientOptions.smeeUrl,
      channelIds: dataStore
        .map((guildStore) => guildStore.channels.commits)
        .filter((channelId) => channelId.length > 0),
      target: 'http://localhost:6242/webhook',
      port: 6242,
    });

    void this.start(extendedClientOptions);
  }

  public updatePresence(): void {
    const cobaltGuild = this.guilds.cache.find((guild) => {
      return guild.id == COBALT_GUILD_ID;
    });

    let activity: ActivityOptions = {
      name: "Sniffing glue",
      type: ActivityType.Custom,
      state: "Sniffing glue",
    };

    if (cobaltGuild?.memberCount !== undefined) {
      activity = {
        name: `${cobaltGuild?.memberCount} members`,
        type: ActivityType.Watching,
      }
    }

    this.user?.setPresence({
      status: 'dnd',
      activities: [activity],
    });
  }

  private async start(extendedClientOptions: ExtendedClientOptions): Promise<void> {
    this.chatBot.reset();

    await this.registerEvents();
    await this.login(extendedClientOptions.token);
  }

  private async registerEvents(): Promise<void> {
    const eventsDirectory = join(dirname(fileURLToPath(import.meta.url)), '..', 'events');
    const eventFiles = await this.getEventFiles(eventsDirectory);

    for (const eventPath of eventFiles) {
      const eventModule = await import(pathToFileURL(eventPath).href);

      if (!eventModule.default) {
        continue;
      }

      const event = new eventModule.default();

      if (!(event instanceof Event)) {
        continue;
      }

      if (event.once) {
        this.once(event.name, (...args) => {
          void (
            event.execute as (
              client: ExtendedClient,
              ...eventArgs: unknown[]
            ) => Promise<void> | void
          )(this, ...args);
        });
      } else {
        this.on(event.name, (...args) => {
          void (
            event.execute as (
              client: ExtendedClient,
              ...eventArgs: unknown[]
            ) => Promise<void> | void
          )(this, ...args);
        });
      }
    }
  }

  private async getEventFiles(directory: string): Promise<string[]> {
    const entries = await readdir(directory, { withFileTypes: true });
    const eventFiles: string[] = [];

    for (const entry of entries) {
      const fullPath = join(directory, entry.name);

      if (entry.isDirectory()) {
        eventFiles.push(...(await this.getEventFiles(fullPath)));
        continue;
      }

      if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.ts'))) {
        eventFiles.push(fullPath);
      }
    }

    return eventFiles;
  }
}
