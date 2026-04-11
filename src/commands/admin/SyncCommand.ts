import { PermissionFlagsBits } from 'discord.js';
import { ExtendedClient } from '@structures/Client.js';
import { Command, CommandContext, CommandCheckFlags } from '@structures/Command.js';
import { Embeds } from '@utils/Embeds.js';
import * as ds from '@data/DataStore.js';

export default class SyncCommand extends Command {
  constructor() {
    super({
      name: 'sync',
      description: "Cleanup each member's roles",
      requiredPermissions: [PermissionFlagsBits.Administrator],
      checkFlags: CommandCheckFlags.Guild,
    });
  }

  public async execute(client: ExtendedClient, context: CommandContext): Promise<void> {
    const guild = context.guild!;
    const data = ds.getDataForId(guild);

    if (!data) {
      return await context.reply({
        embeds: [Embeds.error('Something went wrong, please try again later.')],
      });
    }

    const members = await guild.members.fetch();
    const communityRole = guild.roles.cache.get(data.roles.community);
    const ignoredRoles = new Set(
      [
        guild.id, // @everyone role
        guild.roles.premiumSubscriberRole?.id,
        guild.roles.cache.get(data.roles.updates)?.id,
        guild.roles.cache.get(data.roles.qotd)?.id,
        guild.roles.cache.get(data.roles.support)?.id,
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
