import { ChatInputCommandInteraction } from 'discord.js';
import { Event } from '../structures/Event.js';
import { ExtendedClient } from '../structures/Client.js';
import { Embeds } from '../utils/Embeds.js';

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
      return;
    }

    if (!command.hasRequiredPermissions(interaction.memberPermissions)) {
      const missingPermissions = command.getMissingPermissions(interaction.memberPermissions);
      const message = missingPermissions.length
        ? `You need ${missingPermissions.join(', ')} to use this command.`
        : 'You do not have permission to use this command.';

      await interaction.reply({
        embeds: [Embeds.error(message)],
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
      await command.execute(client, context);
    } catch (error) {
      const errorMessage = {
        embeds: [Embeds.error(`${error instanceof Error ? error.message : 'Unknown error'}`)],
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
