import { PermissionsBitField } from 'discord.js';
import { Command, CommandContext } from '@structures/Command.js';
import { ExtendedClient } from '@structures/Client.js';
import { Embeds } from '@utils/Embeds.js';

export default class DevResetCommand extends Command {
  constructor() {
    super({
      name: 'devreset',
      description: 'Reset the chat bot',
      requiredPermissions: [PermissionsBitField.Flags.Administrator],
    });
  }

  public async execute(client: ExtendedClient, context: CommandContext): Promise<void> {
    client.chatBot.reset();

    await context.reply({
      embeds: [Embeds.success('Successfully reset chatbot.')],
    });
  }
}
