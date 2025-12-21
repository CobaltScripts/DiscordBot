import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { infoEmbed, successEmbed } from '../../utils/embeds.js';
import constants from '../../utils/constants.js';

export default {
  data: new SlashCommandBuilder()
    .setName('sync')
    .setDescription('Syncs roles for all members')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  /**
   * @param {import("../../client/bot.js").Bot} client
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(client, interaction) {
    const guild = interaction.guild;
    await guild.members.fetch();
    const members = guild.members.cache;

    const communityRole = guild.roles.cache.get(
      constants.ROLES.COMMUNITY,
    );

    const ignoredRoles = new Set([
      guild.roles.premiumSubscriberRole || null?.id,
      guild.roles.cache.get(constants.ROLES.UPDATES)?.id,
      guild.roles.cache.get(constants.ROLES.QOTD_PING)?.id,
      guild.roles.cache.get(constants.ROLES.SUPPORT)?.id,
    ]);

    await interaction.reply({
      embeds: [
        infoEmbed(`Starting sync for ${members.size} members...`),
      ],
    });

    for (const member of members.values()) {
      const realRoles = member.roles.cache.filter(
        (r) => !ignoredRoles.has(r.id) && r.id !== guild.id,
      );

      const highestRealRole = realRoles.size
        ? realRoles.reduce((a, b) =>
            b.position > a.position ? b : a,
          )
        : null;

      const chosenRole = highestRealRole ?? communityRole;

      const rolesToRemove = realRoles.filter(
        (r) => r.id !== chosenRole?.id,
      );

      if (rolesToRemove.size > 0) {
        await member.roles.remove(rolesToRemove).catch(() => {});
      }

      if (chosenRole && !member.roles.cache.has(chosenRole.id)) {
        await member.roles.add(chosenRole).catch(() => {});
      }
    }

    await interaction.editReply({
      embeds: [
        successEmbed(
          `Finished sync for all ${members.size} members!`,
        ),
      ],
    });
  },
};
