import { Client, GatewayIntentBits } from 'discord.js';
import { readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Event } from './Event.js';

export interface ExtendedClientOptions {
  token: string;
  smeeUrl: string;
}

export class ExtendedClient extends Client {
  constructor(extendedClientOptions: ExtendedClientOptions) {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    void this.start(extendedClientOptions);
  }

  private async start(extendedClientOptions: ExtendedClientOptions): Promise<void> {
    await this.registerEvents();
    await this.login(extendedClientOptions.token);
  }

  private async registerEvents(): Promise<void> {
    const eventsDirectory = join(dirname(fileURLToPath(import.meta.url)), '..', 'events');
    const eventFiles = (await readdir(eventsDirectory)).filter(
      (file) => file.endsWith('.js') || file.endsWith('.ts')
    );

    for (const file of eventFiles) {
      const eventPath = join(eventsDirectory, file);
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
}
