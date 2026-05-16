import { PermissionsBitField } from 'discord.js';
import { Command, CommandContext, CommandCheckFlags } from '@structures/Command.js';
import { ExtendedClient } from '@structures/Client.js';
import { Embeds } from '@utils/Embeds.js';
import Constants from '@utils/Constants.js';

export default class ShutdownCommand extends Command {
  constructor() {
    super({
      name: 'shutdown',
      description: 'Shut down the bot',
      checkFlags: CommandCheckFlags.Author | CommandCheckFlags.Guild,
      requiredPermissions: [PermissionsBitField.Flags.Administrator],
    });
  }

  public async execute(client: ExtendedClient, context: CommandContext): Promise<void> {
    const author = context.author!;

    if (!Constants.trustedUsers.includes(author.id)) {
      await context.reply({
        embeds: [Embeds.error('You are not authorized to use this command.')],
      });

      return;
    }

    await context.reply({
      embeds: [Embeds.error('Shutting down...')],
    });

    await client.destroy();
    process.exit();
  }
}
