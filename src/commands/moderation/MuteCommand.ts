import { Argument } from '@structures/Argument.js';
import { ExtendedClient } from '@structures/Client.js';
import { Command, CommandContext } from '@structures/Command.js';
import { PermissionsBitField } from 'discord.js';
import { Embeds } from '@utils/Embeds.js';

export default class MuteCommand extends Command {
  constructor() {
    super({
      name: 'mute',
      description: 'Mute a user',
      requiredPermissions: [PermissionsBitField.Flags.ModerateMembers],
      args: [
        new Argument({
          name: 'user',
          description: 'The user to mute',
          type: 'user',
          required: true,
        }),
        new Argument({
          name: 'duration',
          description: 'The duration to mute the user for (e.g. 10m, 1h, 1d)',
          type: 'string',
          required: true,
        }),
        new Argument({
          name: 'reason',
          description: 'The reason for muting the user',
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
    const durationString = context.args.duration as string;
    const durationMs = this.parseDuration(durationString);

    if (durationMs === null) {
      return await context.reply({
        embeds: [Embeds.error('Invalid duration format. Use something like 10m, 1h, or 1d.')],
      });
    }

    try {
      await user.timeout(durationMs, `${author?.tag}: ${context.args.reason as string | undefined}`);

      await context.reply({
        embeds: [Embeds.success(`${user.user.tag} has been muted for ${durationString}.`)],
      });
    } catch (error) {
      await context.reply({
        embeds: [Embeds.error('Something went wrong when trying to mute this user...')],
      });
    }
  }

  private parseDuration(duration: string): number | null {
    const regex = /^(\d+)(s|m|h|d)$/;
    const match = duration.match(regex);

    if (!match) {
      return null;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return null;
    }
  }
}
