import { PermissionFlagsBits } from 'discord.js';
import { ExtendedClient } from '@structures/Client.js';
import { Command, CommandContext, CommandCheckFlags } from '@structures/Command.js';
import { Embeds } from '@utils/Embeds.js';
import Constants from '@utils/Constants.js';

export default class SyncCommand extends Command {
  constructor() {
    super({
      name: 'sync',
      description: "Cleanup each member's roles",
      checkFlags: CommandCheckFlags.Guild,
      requiredPermissions: [PermissionFlagsBits.Administrator],
    });
  }

  public async execute(_: ExtendedClient, context: CommandContext): Promise<void> {
    const guild = context.guild!;
    const members = await guild.members.fetch();
    const communityRole = guild.roles.cache.get(Constants.roles.community);
    const ignoredRoles = new Set(
      [
        guild.id, // @everyone role
        guild.roles.premiumSubscriberRole?.id,
        guild.roles.cache.get(Constants.roles.updates)?.id,
        guild.roles.cache.get(Constants.roles.qotd)?.id,
        guild.roles.cache.get(Constants.roles.support)?.id,
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
