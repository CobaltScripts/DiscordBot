import { Event } from '../structures/Event.js';
import Constants from '../utils/Constants.js';
import SoftBanCommand from '../commands/moderation/SoftBanCommand.js';
export default class HackedAccountHandleEvent extends Event {
    constructor() {
        super({
            name: 'messageCreate',
        });
    }
    async execute(client, message) {
        if (!message.inGuild()) {
            return;
        }
        if (message.author.id == client.user?.id) {
            return;
        }
        if (message.guildId != Constants.guildId) {
            return;
        }
        if (message.channelId != Constants.channels.hook) {
            return;
        }
        await SoftBanCommand.softban(message.member, 'Potentially compromised account', client.user?.tag ?? 'Unknown');
    }
}
