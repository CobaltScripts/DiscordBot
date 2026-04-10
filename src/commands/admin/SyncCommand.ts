import { PermissionFlagsBits } from 'discord.js';
import { ExtendedClient } from '@structures/Client.js';
import { Command, CommandContext } from '@structures/Command.js';
import { Constants } from '@utils/Constants.js';
import { Embeds } from '@utils/Embeds.js';

export default class SyncCommand extends Command {
  constructor() {
    super({
      name: 'sync',
      description: "Cleanup each member's roles",
      requiredPermissions: [PermissionFlagsBits.Administrator],
    });
  }

  public async execute(client: ExtendedClient, context: CommandContext): Promise<void> {
    const guild = context.interaction?.guild ?? context.message?.guild;

    if (!guild) {
      return await context.reply({
        embeds: [Embeds.error('This command can only be used in a server.')],
      });
    }

    const members = await guild.members.fetch();
    const communityRole = guild.roles.cache.get(Constants.ROLES.COMMUNITY);
    const ignoredRoles = new Set(
      [
        guild.id, // @everyone role
        guild.roles.premiumSubscriberRole?.id,
        guild.roles.cache.get(Constants.ROLES.UPDATES)?.id,
        guild.roles.cache.get(Constants.ROLES.QOTD_PING)?.id,
        guild.roles.cache.get(Constants.ROLES.SUPPORT)?.id,
      ].filter((id) => id != null)
    );

    await context.reply({
      embeds: [Embeds.info(`Starting sync for ${members.size} members...`)],
    });

    for (const member of members.values()) {
      const realRoles = member.roles.cache.filter(
        (r) => !ignoredRoles.has(r.id) && r.id !== guild.id
      );

      const highestRealRole = realRoles.size
        ? realRoles.reduce((a, b) => (b.position > a.position ? b : a))
        : null;

      const chosenRole = highestRealRole ?? communityRole;

      const rolesToRemove = realRoles.filter((r) => r.id !== chosenRole?.id);

      if (rolesToRemove.size > 0) {
        await member.roles.remove(rolesToRemove).catch(() => {});
      }

      if (chosenRole && !member.roles.cache.has(chosenRole.id)) {
        await member.roles.add(chosenRole).catch(() => {});
      }
    }

    await context.editReply({
      embeds: [Embeds.success(`Finished sync for all ${members.size} members!`)],
    });
  }
}
