import { PermissionsBitField } from 'discord.js';
import { Command, CommandContext } from '@structures/Command.js';
import { ExtendedClient } from '@structures/Client.js';
import { Embeds } from '@utils/Embeds.js';
import { Constants } from '@utils/Constants.js';

export default class CrashCommand extends Command {
  constructor() {
    super({
      name: 'crash',
      description: 'Crash the bot',
      requiredPermissions: [PermissionsBitField.Flags.Administrator],
    });
  }

  public async execute(client: ExtendedClient, context: CommandContext): Promise<void> {
    const author = context.interaction?.user || context.message?.author;

    if (!author) {
      await context.reply({
        embeds: [Embeds.error('Unable to identify the command author.')],
      });

      return;
    }

    if (!Constants.TRUSTED_USER_IDS.includes(author.id)) {
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
