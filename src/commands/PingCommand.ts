import { Command, CommandContext } from '../structures/Command.js';
import { Argument } from '../structures/Argument.js';

export default class PingCommand extends Command {
  constructor() {
    super({
      name: 'ping',
      description: 'Check the bot latency',
      args: [
        new Argument({
          name: 'detailed',
          description: 'Show detailed latency information',
          type: 'boolean',
          required: false,
        }),
      ],
    });
  }

  public async execute(context: CommandContext): Promise<void> {
    const botLatency = context.client.ws.ping;
    const detailed = context.args.detailed as boolean | undefined;

    if (detailed) {
      const timestamp =
        context.interaction?.createdTimestamp || context.message?.createdTimestamp || Date.now();
      const messageLatency = Date.now() - timestamp;

      await context.reply({
        content: `🏓 Pong!\n- Bot Latency: ${botLatency}ms\n- API Latency: ${messageLatency}ms`,
      });
    } else {
      await context.reply({
        content: `🏓 Pong! ${botLatency}ms`,
      });
    }
  }
}
