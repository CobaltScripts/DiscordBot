import { PermissionFlagsBits, TextChannel } from 'discord.js';
import { ExtendedClient } from '@structures/Client.js';
import { Command, CommandContext } from '@structures/Command.js';
import { Embeds } from '@utils/Embeds.js';
import { Argument } from '@structures/Argument.js';

export default class PurgeCommand extends Command {
  constructor() {
    super({
      name: 'purge',
      description: 'Purge and recreate a channel',
      requiredPermissions: [PermissionFlagsBits.ManageChannels],
      args: [
        new Argument({
          name: 'channel',
          description: 'The channel to purge',
          type: 'channel',
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

    const originalChannel = context.args.channel
      ? guild?.channels.cache.get(context.args.channel as string)
      : (context.interaction?.channel ?? context.message?.channel);

    if (!originalChannel || !originalChannel.isTextBased()) {
      return await context.reply({
        embeds: [Embeds.error('Channel not found or not text-based.')],
      });
    }

    const textChannel = originalChannel as TextChannel;
    const newChannel = await textChannel.clone({
      name: textChannel.name,
      topic: textChannel.topic ?? '',
      nsfw: textChannel.nsfw,
      permissionOverwrites: textChannel.permissionOverwrites.cache,
    });

    if (textChannel.parentId) {
      await newChannel.setParent(textChannel.parentId, {
        lockPermissions: false,
      });
    }

    await newChannel.setPosition(textChannel.position);
    await textChannel.delete(`Purged by ${author?.tag}`);

    await newChannel.send({
      embeds: [Embeds.success(`Channel purged by ${author?.tag}`)],
    });
  }
}
