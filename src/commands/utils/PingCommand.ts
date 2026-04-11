import { ExtendedClient } from '@structures/Client.js';
import { Command, CommandContext, CommandCheckFlags } from '@structures/Command.js';
import { Embeds } from '@utils/Embeds.js';

export default class PingCommand extends Command {
  constructor() {
    super({
      name: 'ping',
      checkFlags: CommandCheckFlags.None,
      description: 'Check the bot latency',
    });
  }

  public async execute(client: ExtendedClient, context: CommandContext): Promise<void> {
    await context.reply({
      embeds: [Embeds.info('🏓 Pong!')],
    });
  }
}
