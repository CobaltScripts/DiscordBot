import { Event } from '../structures/event.js';
import { ExtendedClient } from '../structures/client.js';
import { Message } from 'discord.js';

export default class MessageCreateEvent extends Event<'messageCreate'> {
  constructor() {
    super({
      name: 'messageCreate',
    });
  }

  public execute(_: ExtendedClient, __: Message): void {}
}
