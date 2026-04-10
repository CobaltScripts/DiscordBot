import { PermissionFlagsBits, TextChannel } from 'discord.js';
import { ExtendedClient } from '@structures/Client.js';
import { Command, CommandContext } from '@structures/Command.js';
import { Embeds } from '@utils/Embeds.js';
import { Argument } from '@structures/Argument.js';

export default class LockCommand extends Command {
  constructor() {
    super({
      name: 'lock',
      description: 'Lock a channel',
      requiredPermissions: [PermissionFlagsBits.ManageChannels],
      args: [
        new Argument({
          name: 'channel',
          description: 'The channel to lock',
          type: 'channel',
          required: false,
        }),
      ],
    });
  }

  public async execute(client: ExtendedClient, context: CommandContext): Promise<void> {
    const guild = context.interaction?.guild ?? context.message?.guild;

    if (!guild) {
      return await context.reply({
        embeds: [Embeds.error('This command can only be used in a server.')],
      });
    }

    const channel = context.args.channel
      ? guild?.channels.cache.get(context.args.channel as string)
      : (context.interaction?.channel ?? context.message?.channel);

    if (!channel || !channel.isTextBased()) {
      return await context.reply({
        embeds: [Embeds.error('Channel not found or not text-based.')],
      });
    }

    const textChannel = channel as TextChannel;
    const everyoneRole = guild.roles.everyone;

    const isLocked = textChannel.permissionOverwrites.cache
      .get(everyoneRole.id)
      ?.deny.has(PermissionFlagsBits.SendMessages);

    await textChannel.permissionOverwrites.edit(everyoneRole, {
      SendMessages: isLocked ? null : false,
    });

    await context.reply({
      embeds: [Embeds.success(`Channel ${isLocked ? 'unlocked' : 'locked'}!`)],
    });
  }
}
