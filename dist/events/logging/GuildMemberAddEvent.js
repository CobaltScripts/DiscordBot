import { Event } from '../../structures/Event.js';
import { buildGuildMemberLogEmbed } from '../../utils/GuildMemberLog.js';
import Constants from '../../utils/Constants.js';
export default class GuildMemberAddEvent extends Event {
    constructor() {
        super({
            name: 'guildMemberAdd',
        });
    }
    async execute(client, member) {
        const guild = member.guild;
        const embed = buildGuildMemberLogEmbed(member, 'Member Joined', 0x57f287, `${member.user.toString()} has joined the server.`);
        const channel = guild.channels.cache.get(Constants.channels.logging);
        if (!channel || !channel.isTextBased()) {
            return;
        }
        await client.updatePresence();
        await member.roles.add(Constants.roles.community);
        await channel.send({ embeds: [embed] });
    }
}
