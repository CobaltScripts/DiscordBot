import { Event } from '../structures/Event.js';
import { Embeds } from '../utils/Embeds.js';
export default class MessageCreateEvent extends Event {
    constructor() {
        super({
            name: 'messageCreate',
        });
    }
    async execute(client, message) {
        if (message.author.bot) {
            return;
        }
        if (!message.content.startsWith(client.prefix)) {
            return;
        }
        const args = message.content.slice(client.prefix.length).trim().split(/\s+/);
        const commandName = args.shift()?.toLowerCase();
        if (!commandName) {
            return;
        }
        const command = client.commandManager?.getCommand(commandName);
        if (!command) {
            return;
        }
        if (!command.hasRequiredPermissions(message.member?.permissions)) {
            return;
        }
        try {
            const parsedArgs = await command.parseChatArgs(args, message.guild ?? undefined);
            const context = command.createContext(client, parsedArgs, undefined, message);
            await command.run(client, context);
        }
        catch (error) {
            await message.reply({
                embeds: [Embeds.error(`${error instanceof Error ? error.message : 'Unknown error'}`)],
            });
        }
    }
}
