import { PermissionsBitField } from 'discord.js';
import { Command, CommandContext, CommandCheckFlags } from '@structures/Command.js';
import { ExtendedClient } from '@structures/Client.js';
import { Embeds } from '@utils/Embeds.js';
import * as ds from '@data/DataStore.js';

export default class CrashCommand extends Command {
  constructor() {
    super({
      name: 'crash',
      description: 'Crash the bot',
      requiredPermissions: [PermissionsBitField.Flags.Administrator],
      checkFlags: CommandCheckFlags.Author | CommandCheckFlags.Guild,
    });
  }

  public async execute(client: ExtendedClient, context: CommandContext): Promise<void> {
    const author = context.author!;
    const data = ds.getDataFromContext(context);

    if (!data) {
      return await context.reply({
        embeds: [Embeds.error('Something went wrong, please try again later.')],
      });
    }

    if (!data.trusted.includes(author.id)) {
      await context.reply({
        embeds: [Embeds.error('You are not authorized to use this command.')],
      });

      return;
    }

    await context.reply({
      embeds: [Embeds.error('Crashing...')],
    });

    process.exit(0);
  }
}
