import { PermissionsBitField } from 'discord.js';
import { Command, CommandCheckFlags } from '../../structures/Command.js';
import { Embeds } from '../../utils/Embeds.js';
import Constants from '../../utils/Constants.js';
export default class DevResetCommand extends Command {
    constructor() {
        super({
            name: 'devreset',
            description: 'Reset the chat bot',
            checkFlags: CommandCheckFlags.Author | CommandCheckFlags.Guild,
            requiredPermissions: [PermissionsBitField.Flags.Administrator],
        });
    }
    async execute(client, context) {
        const author = context.author;
        if (!Constants.trustedUsers.includes(author.id)) {
            await context.reply({
                embeds: [Embeds.error('You are not authorized to use this command.')],
            });
            return;
        }
        client.chatBot.reset();
        await context.reply({
            embeds: [Embeds.success('Successfully reset chatbot.')],
        });
    }
}
