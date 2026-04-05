import { ExtendedClient } from '../../structures/Client.js';
import { Command, CommandContext } from '../../structures/Command.js';
import { Embeds } from '../../utils/Embeds.js';

export default class PingCommand extends Command {
  constructor() {
    super({
      name: 'ping',
      description: 'Check the bot latency',
    });
  }

  public async execute(_: ExtendedClient, context: CommandContext): Promise<void> {
    await context.reply({
      embeds: [Embeds.info('🏓 Pong!')],
    });
  }
}
