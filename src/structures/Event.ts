import { ClientEvents } from 'discord.js';
import { ExtendedClient } from '@structures/Client.js';

export interface EventOptions<K extends keyof ClientEvents> {
  name: K;
  once?: boolean;
}

export abstract class Event<K extends keyof ClientEvents = keyof ClientEvents> {
  public readonly name: K;
  public readonly once: boolean;

  constructor(options: EventOptions<K>) {
    this.name = options.name;
    this.once = options?.once ?? false;
  }

  public abstract execute(client: ExtendedClient, ...args: ClientEvents[K]): Promise<void> | void;
}
