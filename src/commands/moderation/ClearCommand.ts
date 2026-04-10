import { PermissionFlagsBits, TextChannel } from 'discord.js';
import { ExtendedClient } from '@structures/Client.js';
import { Command, CommandContext } from '@structures/Command.js';
import { Embeds } from '@utils/Embeds.js';
import { Argument } from '@structures/Argument.js';

export default class ClearCommand extends Command {
  constructor() {
    super({
      name: 'clear',
      description: 'Clear messages from a channel',
      requiredPermissions: [PermissionFlagsBits.ManageMessages],
      args: [
        new Argument({
          name: 'amount',
          description: 'The number of messages to clear',
          type: 'number',
          required: true,
        }),
      ],
    });
  }

  public async execute(_: ExtendedClient, context: CommandContext): Promise<void> {
    const guild = context.interaction?.guild ?? context.message?.guild;

    if (!guild) {
      return await context.reply({
        embeds: [Embeds.error('This command can only be used in a server.')],
      });
    }

    const amount = context.args.amount as number;

    if (!amount || isNaN(amount) || amount < 1 || amount > 100) {
      return await context.reply({
        embeds: [Embeds.error('Please provide a valid number of messages to delete (1-100).')],
      });
    }

    const channel = (context.interaction?.channel ?? context.message?.channel) as TextChannel;

    if (!context.interaction) {
      await context.message?.delete();
      await channel.bulkDelete(amount, true);
    }

    const msg = await channel.send({
      embeds: [Embeds.success(`Deleted ${amount} messages.`)],
    });

    setTimeout(() => msg.delete(), 3000);
  }
}
