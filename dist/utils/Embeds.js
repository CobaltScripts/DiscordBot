import { EmbedBuilder, Colors } from 'discord.js';
export class Embeds {
    static success(message) {
        return this.createEmbed(message, Colors.Green);
    }
    static info(message) {
        return this.createEmbed(message, Colors.Blue);
    }
    static warn(message) {
        return this.createEmbed(message, Colors.Yellow);
    }
    static error(message) {
        return this.createEmbed(message, Colors.Red);
    }
    static createEmbed(message, color) {
        return new EmbedBuilder().setDescription(`**${message}**`).setColor(color);
    }
}
