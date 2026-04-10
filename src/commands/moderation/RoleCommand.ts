import { PermissionFlagsBits } from 'discord.js';
import { ExtendedClient } from '@structures/Client.js';
import { Command, CommandContext } from '@structures/Command.js';
import { Embeds } from '@utils/Embeds.js';
import { Argument } from '@structures/Argument.js';

export default class RoleCommand extends Command {
  constructor() {
    super({
      name: 'role',
      description: 'Give or remove a role from a user',
      requiredPermissions: [PermissionFlagsBits.ManageRoles],
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
    const guild = context.interaction?.guild ?? context.message?.guild;
    const author = context.interaction?.user ?? context.message?.author;

    if (!guild) {
      return await context.reply({
        embeds: [Embeds.error('This command can only be used in a server.')],
      });
    }

    const user = guild.members.cache.get(context.args.user as string);

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

    const authorAsMember = guild.members.cache.get(author?.id ?? '');

    if (!authorAsMember) {
      return await context.reply({
        embeds: [Embeds.error('Author not found in the server.')],
      });
    }

    if (authorAsMember.roles.highest.position <= role.position && guild.ownerId !== author?.id) {
      return await context.reply({
        embeds: [
          Embeds.error(
            'You cannot manage a role that is higher than or equal to your highest role.'
          ),
        ],
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
