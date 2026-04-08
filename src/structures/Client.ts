import { ActivityType, Client, GatewayIntentBits, Partials, TextChannel } from 'discord.js';
import { readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Event } from './Event.js';
import { CommandManager } from './CommandManager.js';
import { Constants } from '../utils/Constants.js';
import { SmeeClient } from '../utils/SmeeClient.js';
import { ChatBot } from '../utils/ChatBot.js';
import { Embeds } from '../utils/Embeds.js';
import { Logger } from '../utils/Logger.js';

export interface ExtendedClientOptions {
  token: string;
  smeeUrl: string;
  geminiApiKey: string;
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
    this.chatBot = new ChatBot(this, extendedClientOptions.geminiApiKey);
    this.smeeClient = new SmeeClient({
      source: extendedClientOptions.smeeUrl,
      channelId: Constants.CHANNELS.COMMITS_CHANNEL,
      target: 'http://localhost:6242/webhook',
      port: 6242,
    });

    void this.start(extendedClientOptions);
  }

  public updatePresence(): void {
    const cobaltGuild = this.guilds.cache.find((guild) => {
      return guild.id == Constants.GUILD_ID;
    });

    this.user?.setPresence({
      status: 'dnd',
      activities: [
        {
          name: `${cobaltGuild?.memberCount} members`,
          type: ActivityType.Watching,
        },
      ],
    });
  }

  public async logError(message: string): Promise<void> {
    try {
      const guild = this.guilds.cache.get(Constants.GUILD_ID);
      const channel = guild?.channels.cache.get(Constants.CHANNELS.BOT_ERRORS);

      if (!channel || !channel.isTextBased()) {
        return;
      }

      await (channel as TextChannel).send({
        embeds: [Embeds.error(message)],
      });
    } catch (error) {
      Logger.error(
        `Failed to send error message: ${error instanceof Error ? error.message : String(error)}`
      );
    }
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
