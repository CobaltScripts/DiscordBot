import { PermissionsBitField } from 'discord.js';
import { Command, CommandContext, CommandCheckFlags } from '@structures/Command.js';
import { ExtendedClient } from '@structures/Client.js';
import { Embeds } from '@utils/Embeds.js';
import { Constants } from '@utils/Constants.js';

export default class DevResetCommand extends Command {
  constructor() {
    super({
      name: 'devreset',
      description: 'Reset the chat bot',
      requiredPermissions: [PermissionsBitField.Flags.Administrator],
      checkFlags: CommandCheckFlags.Author | CommandCheckFlags.Guild,
    });
  }

  public async execute(client: ExtendedClient, context: CommandContext): Promise<void> {
    const author = context.author!;

    if (!Constants.TRUSTED_USER_IDS.includes(author.id)) {
      await context.reply({
        embeds: [Embeds.error('You are not authorized to use this command.')],
      });

      return;
    }

    client.chatBot.reset();

    await context.reply({
      embeds: [Embeds.success('Successfully reset chatbot.')],
    });
  }
}
