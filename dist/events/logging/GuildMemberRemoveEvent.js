import { Event } from '../../structures/Event.js';
import { buildGuildMemberLogEmbed } from '../../utils/GuildMemberLog.js';
import Constants from '../../utils/Constants.js';
export default class GuildMemberRemoveEvent extends Event {
    constructor() {
        super({
            name: 'guildMemberRemove',
        });
    }
    async execute(client, member) {
        const guild = member.guild;
        const embed = buildGuildMemberLogEmbed(member, 'Member Left', 0xed4245, `${member.user.toString()} has left the server.`);
        const channel = guild.channels.cache.get(Constants.channels.logging);
        if (!channel || !channel.isTextBased()) {
            return;
        }
        await client.updatePresence();
        await channel.send({ embeds: [embed] });
    }
}
