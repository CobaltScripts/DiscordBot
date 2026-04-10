import { Argument } from '@structures/Argument.js';
import { ExtendedClient } from '@structures/Client.js';
import { Command, CommandContext } from '@structures/Command.js';
import { PermissionsBitField } from 'discord.js';
import { Embeds } from '@utils/Embeds.js';

export default class UnmuteCommand extends Command {
  constructor() {
    super({
      name: 'unmute',
      description: 'Unmute a user',
      requiredPermissions: [PermissionsBitField.Flags.ModerateMembers],
      args: [
        new Argument({
          name: 'user',
          description: 'The user to unmute',
          type: 'user',
          required: true,
        }),
        new Argument({
          name: 'reason',
          description: 'The reason for unmuting the user',
          type: 'string',
          required: false,
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

    const user = guild.members.cache.get(context.args.user as string);

    if (!user) {
      return await context.reply({
        embeds: [Embeds.error('User not found.')],
      });
    }

    if (!user.isCommunicationDisabled()) {
      return await context.reply({
        embeds: [Embeds.error('This user is not muted.')],
      });
    }

    try {
      await user.timeout(null, context.args.reason as string | undefined);

      await context.reply({
        embeds: [Embeds.success(`${user.user.tag} has been unmuted.`)],
      });
    } catch (error) {
      await context.reply({
        embeds: [Embeds.error('Something went wrong when trying to unmute this user...')],
      });
    }
  }
}
