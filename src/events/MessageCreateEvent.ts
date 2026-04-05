import { Event } from '../structures/Event.js';
import { ExtendedClient } from '../structures/Client.js';
import { Message } from 'discord.js';

export default class MessageCreateEvent extends Event<'messageCreate'> {
  constructor() {
    super({
      name: 'messageCreate',
    });
  }

  public execute(_: ExtendedClient, __: Message): void {}
}
