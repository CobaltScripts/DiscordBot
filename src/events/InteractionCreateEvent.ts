import { ChatInputCommandInteraction } from 'discord.js';
import { Event } from '../structures/Event.js';
import { ExtendedClient } from '../structures/Client.js';
import { Logger } from '../utils/Logger.js';

export default class InteractionCreateEvent extends Event {
  constructor() {
    super({ name: 'interactionCreate' });
  }

  public async execute(
    client: ExtendedClient,
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commandManager?.getCommand(interaction.commandName);

    if (!command) {
      Logger.warn(`Command not found: ${interaction.commandName}`);
      await interaction.reply({
        content: 'This command is not available.',
        ephemeral: true,
      });
      return;
    }

    try {
      const args: Record<string, string | number | boolean | object | null | undefined> = {};

      for (const arg of command.args) {
        const value = interaction.options.get(arg.name);

        if (value) {
          args[arg.name] = value.value as string | number | boolean | object | null | undefined;
        }
      }

      const context = command.createContext(client, args, interaction);
      await command.execute(context);
    } catch (error) {
      Logger.error(
        `Error executing command ${interaction.commandName}: ${error instanceof Error ? error.message : String(error)}`
      );

      const errorMessage = {
        content: 'An error occurred while executing this command.',
        ephemeral: true,
      };

      if (interaction.replied) {
        await interaction.editReply(errorMessage);
      } else if (interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  }
}
