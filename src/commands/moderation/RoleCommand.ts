import { PermissionFlagsBits } from 'discord.js';
import { ExtendedClient } from '@structures/Client.js';
import { Command, CommandContext, CommandCheckFlags } from '@structures/Command.js';
import { Embeds } from '@utils/Embeds.js';
import { Argument } from '@structures/Argument.js';
import Constants from '@utils/Constants.js';

export default class RoleCommand extends Command {
  constructor() {
    super({
      name: 'role',
      description: 'Give or remove a role from a user',
      checkFlags: CommandCheckFlags.Author | CommandCheckFlags.Guild,
      requiredPermissions: [],
      args: [
        new Argument({
          name: 'user',
          description: 'The user to give or remove a role from',
          type: 'user',
          required: true,
        }),
        new Argument({
          name: 'role',
          description: 'The role to give or remove',
          type: 'role',
          required: true,
        }),
      ],
    });
  }

  public async execute(_: ExtendedClient, context: CommandContext): Promise<void> {
    const guild = context.guild!;
    const author = context.author!;
    const user = guild.members.cache.get(context.args.user as string) ?? await guild.members.fetch(context.args.user as string).catch(() => null);
    const authorAsMember = guild.members.cache.get(author.id) ?? await guild.members.fetch(author.id).catch(() => null);

    if (!authorAsMember) {
      return await context.reply({ embeds: [Embeds.error('Author not found in the server.')] });
    }

    const isTrusted = Constants.trustedUsers.includes(author.id);
    const isOwner = guild.ownerId === author.id;
    const isAdmin = authorAsMember.permissions.has(PermissionFlagsBits.Administrator);

    if (!user) {
      return await context.reply({
        embeds: [Embeds.error('User not found.')],
      });
    }

    const role = guild.roles.cache.get(context.args.role as string);

    if (!role) {
      return await context.reply({
        embeds: [Embeds.error('Role not found.')],
      });
    }

    if (role.managed || role.id === guild.id) {
      return await context.reply({ embeds: [Embeds.error('You cannot give yourself a bot role')] });
    }

    if (!isAdmin && !isTrusted) {
      return await context.reply({ embeds: [Embeds.error('You cannot run this command.')] });
    }

    if (!isOwner && !isTrusted && authorAsMember.roles.highest.position <= role.position) {
      return await context.reply({
        embeds: [Embeds.error('You cannot manage a role that is higher than or equal to your highest role.')],
      });
    }

    if (user.roles.cache.has(role.id)) {
      await user.roles.remove(role, `Role removed by ${author?.tag}`);
      await context.reply({
        embeds: [Embeds.success(`Removed the ${role.name} role from ${user.user.tag}.`)],
      });
    } else {
      await user.roles.add(role, `Role added by ${author?.tag}`);
      await context.reply({
        embeds: [Embeds.success(`Added the ${role.name} role to ${user.user.tag}.`)],
      });
    }
  }
}
