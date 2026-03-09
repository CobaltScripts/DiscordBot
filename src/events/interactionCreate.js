import { Events } from 'discord.js';

export default {
  name: Events.InteractionCreate,

  async execute(client, interaction) {
    if (!interaction.isChatInputCommand()) return;

    const cmd = client.slashCommands.get(interaction.commandName);
    if (!cmd) return;

    try {
      await cmd.execute(client, interaction);
    } catch (err) {
      console.error(err);

      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({
          content: 'there was an error :c',
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: 'there was an error :c',
          ephemeral: true,
        });
      }
    }
  },
};
