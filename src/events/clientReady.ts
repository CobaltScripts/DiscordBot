import { Event } from '../structures/event.js';
import { ExtendedClient } from '../structures/client.js';

export default class ClientReadyEvent extends Event<'clientReady'> {
  constructor() {
    super({
      name: 'clientReady',
      once: true,
    });
  }

  public execute(client: ExtendedClient): void {
    console.log(`Logged in as ${client.user?.tag}`);
  }
}
