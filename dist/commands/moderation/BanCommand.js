import { PermissionFlagsBits } from 'discord.js';
import { Command, CommandCheckFlags } from '../../structures/Command.js';
import { Embeds } from '../../utils/Embeds.js';
import { Argument } from '../../structures/Argument.js';
export default class BanCommand extends Command {
    constructor() {
        super({
            name: 'ban',
            description: 'Ban a user from the server',
            checkFlags: CommandCheckFlags.Author | CommandCheckFlags.Guild,
            requiredPermissions: [PermissionFlagsBits.BanMembers],
            args: [
                new Argument({
                    name: 'user',
                    description: 'The user to ban',
                    type: 'user',
                    required: true,
                }),
                new Argument({
                    name: 'reason',
                    description: 'The reason for banning the user',
                    type: 'string',
                    required: false,
                }),
            ],
        });
    }
    async execute(_, context) {
        const guild = context.guild;
        const author = context.author;
        const authorMember = guild.members.cache.get(author.id) ?? await guild.members.fetch(author.id).catch(() => null);
        const user = guild.members.cache.get(context.args.user);
        if (!user) {
            return await context.reply({
                embeds: [Embeds.error('User not found.')],
            });
        }
        if (user.permissions.has('Administrator')) {
            return await context.reply({
                embeds: [Embeds.error("You cannot ban an admin :sob:")]
            });
        }
        if (!authorMember) {
            return await context.reply({
                embeds: [Embeds.error('Could not resolve member?')],
            });
        }
        if (authorMember.roles.highest.position <= user.roles.highest.position) {
            return await context.reply({
                embeds: [Embeds.error("You can't ban someone with an equal or higher role.")],
            });
        }
        await user.ban({
            reason: `${author?.tag}: ${context.args.reason}`,
        });
        await context.reply({
            embeds: [Embeds.success(`${user.user.tag} has been banned.`)],
        });
    }
}
