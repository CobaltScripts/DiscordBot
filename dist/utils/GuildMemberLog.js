import { EmbedBuilder } from 'discord.js';
export function buildGuildMemberLogEmbed(member, title, color, description) {
    const avatarUrl = member.user.displayAvatarURL({ size: 256 });
    const createdAt = `<t:${Math.floor(member.user.createdAt.getTime() / 1000)}:R>`;
    const joinedAt = member.joinedTimestamp
        ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
        : 'Unknown';
    return new EmbedBuilder()
        .setTitle(title)
        .setColor(color)
        .setThumbnail(avatarUrl)
        .setDescription(description)
        .addFields({ name: 'Display Name', value: member.displayName || member.user.username, inline: true }, { name: 'Account Created', value: createdAt, inline: true }, { name: 'Joined Server', value: joinedAt, inline: false })
        .setFooter({ text: `User ID: ${member.user.id}` })
        .setTimestamp();
}
