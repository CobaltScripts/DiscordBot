import { PermissionFlagsBits } from 'discord.js';
import { Command, CommandCheckFlags } from '../../structures/Command.js';
import { Embeds } from '../../utils/Embeds.js';
import { Argument } from '../../structures/Argument.js';
export default class SoftBanCommand extends Command {
    constructor() {
        super({
            name: 'softban',
            description: 'Soft ban a user from the server',
            checkFlags: CommandCheckFlags.Author | CommandCheckFlags.Guild,
            requiredPermissions: [PermissionFlagsBits.BanMembers],
            args: [
                new Argument({
                    name: 'user',
                    description: 'The user to soft ban',
                    type: 'user',
                    required: true,
                }),
                new Argument({
                    name: 'reason',
                    description: 'The reason for soft banning the user',
                    type: 'string',
                    required: false,
                }),
            ],
        });
    }
    async execute(_, context) {
        const guild = context.guild;
        const author = context.author;
        const reason = context.args.reason?.trim() || 'No reason provided';
        const user = guild.members.cache.get(context.args.user);
        if (!user) {
            return await context.reply({
                embeds: [Embeds.error('User not found.')],
            });
        }
        await SoftBanCommand.softban(user, reason, author.tag);
        setTimeout(async () => {
            await context.reply({
                embeds: [Embeds.success(`${user.user.tag} has been soft banned.`)],
            });
        }, 2100);
    }
    static async softban(user, reason, moderatorTag) {
        if (!user) {
            return;
        }
        const guild = user.guild;
        await user.ban({
            deleteMessageSeconds: 60 * 60 * 24,
            reason: `${moderatorTag}: ${reason}`,
        });
        setTimeout(async () => {
            await guild.members.unban(user.id, `Soft ban complete by ${moderatorTag}: ${reason}`);
        }, 2000);
    }
}
