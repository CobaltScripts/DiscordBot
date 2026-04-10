import { PermissionFlagsBits } from 'discord.js';
import { ExtendedClient } from '@structures/Client.js';
import { Command, CommandContext } from '@structures/Command.js';
import { Embeds } from '@utils/Embeds.js';
import { Argument } from '@structures/Argument.js';

export default class BanCommand extends Command {
  constructor() {
    super({
      name: 'ban',
      description: 'Ban a user from the server',
      requiredPermissions: [PermissionFlagsBits.BanMembers],
      args: [
        new Argument({
          name: 'user',
          description: 'The user to ban',
          type: 'user',
          required: true,
        }),
        new Argument({
          name: 'reason',
          description: 'The reason for banning the user',
          type: 'string',
          required: false,
        }),
      ],
    });
  }

  public async execute(client: ExtendedClient, context: CommandContext): Promise<void> {
    const guild = context.interaction?.guild ?? context.message?.guild;
    const author = context.interaction?.user ?? context.message?.author;

    if (!guild) {
      return await context.reply({
        embeds: [Embeds.error('This command can only be used in a server.')],
      });
    }

    const user = guild.members.cache.get(context.args.user as string);

    if (!user) {
      return await context.reply({
        embeds: [Embeds.error('User not found.')],
      });
    }

    await user.ban({
      reason: `${author?.tag}: ${context.args.reason as string | undefined}`,
    });

    await context.reply({
      embeds: [Embeds.success(`${user.user.tag} has been banned.`)],
    });
  }
}
