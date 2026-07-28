import { Command, CommandCheckFlags } from '../../structures/Command.js';
import { Embeds } from '../../utils/Embeds.js';
export default class PingCommand extends Command {
    constructor() {
        super({
            name: 'ping',
            checkFlags: CommandCheckFlags.None,
            description: 'Check the bot latency',
        });
    }
    async execute(_, context) {
        await context.reply({
            embeds: [Embeds.info('🏓 Pong!')],
        });
    }
}
