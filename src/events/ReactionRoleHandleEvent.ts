import { Event } from '../structures/Event.js';
import { ExtendedClient } from '../structures/Client.js';
import { ButtonInteraction, GuildMember, MessageFlags } from 'discord.js';
import { Embeds } from '../utils/Embeds.js';
import { Logger } from '../utils/Logger.js';

export default class ReactionRoleHandleEvent extends Event<'interactionCreate'> {
  constructor() {
    super({
      name: 'interactionCreate',
    });
  }

  public async execute(client: ExtendedClient, interaction: ButtonInteraction): Promise<void> {
    if (!interaction.isButton() || !interaction.customId.startsWith('role_button:')) {
      return;
    }

    if (interaction.guild == null || interaction.member == null) {
      await interaction.reply({
        embeds: [Embeds.error('This interaction can only be used in a server.')],
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    const roleId = interaction.customId.split(':')[1];
    const role = interaction.guild?.roles.cache.get(roleId);
    const member =
      interaction.member instanceof GuildMember
        ? interaction.member
        : await interaction.guild.members.fetch(interaction.user.id);

    if (!role) {
      interaction.reply({
        embeds: [
          Embeds.error(
            'Role not found?? Please ping any <@&1351294598479347732> in general so they can fix this!'
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    if (role.position >= (interaction.guild.members.me?.roles.highest.position ?? 0)) {
      interaction.reply({
        embeds: [
          Embeds.error(
            'Somehow I cannot assign that role, please ping any <@&1351294598479347732> in general so they can fix this!'
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    try {
      if (member.roles.cache.has(roleId)) {
        await member.roles.remove(roleId);
        await interaction.reply({
          embeds: [Embeds.error(`Removed role \`${role.name}\``)],
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await member.roles.add(roleId);
        await interaction.reply({
          embeds: [Embeds.success(`Added role \`${role.name}\``)],
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (error) {
      Logger.error(
        `Failed to update roles for user ${interaction.user.tag} (${interaction.user.id}): ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      await interaction.reply({
        embeds: [Embeds.error('Failed to update roles')],
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}
