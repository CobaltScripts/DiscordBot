import { MessageFlags, PermissionFlagsBits } from 'discord.js';
import { ExtendedClient } from '@structures/Client.js';
import { Command, CommandContext } from '@structures/Command.js';
import { Argument } from '@structures/Argument.js';
import { Embeds } from '@utils/Embeds.js';
import { Constants } from '@utils/Constants.js';

export default class UpdateGeminiKeyCommand extends Command {
  constructor() {
    super({
      name: 'updategeminikey',
      description: 'Update the Gemini API key',
      requiredPermissions: [PermissionFlagsBits.Administrator],
      args: [
        new Argument({
          name: 'key',
          description: 'The new Gemini API key',
          type: 'string',
          required: true,
        }),
      ],
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

    const newKey = context.args.key as string | undefined;

    if (context?.message) {
      await context.message.delete().catch(() => {});
    }

    if (!newKey) {
      return await context.reply({
        embeds: [Embeds.error('Please provide a new Gemini API key.')],
      });
    }

    client.chatBot.updateKey(newKey);

    if (context.interaction) {
      await context.reply({
        embeds: [Embeds.success('Gemini API key updated successfully.')],
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    await context.reply({
      embeds: [Embeds.success('Gemini API key updated successfully.')],
    });
  }
}
