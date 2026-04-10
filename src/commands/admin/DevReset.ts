import { PermissionsBitField } from 'discord.js';
import { Command, CommandContext } from '../../structures/Command.js';
import { ExtendedClient } from '../../structures/Client.js';

export default class DevResetCommand extends Command {
  constructor() {
    super({
      name: 'dev-reset',
      description: 'Reset the chat bot',
      requiredPermissions: [PermissionsBitField.Flags.Administrator],
    });
  }

  public async execute(client: ExtendedClient, context: CommandContext): Promise<void> {
    client.chatBot.reset();

    await context.reply('Successfully reset chatbot.');
  }
}
