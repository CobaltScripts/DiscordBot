import { ColorResolvable, EmbedBuilder, Colors } from 'discord.js';

export class Embeds {
  public static success(message: string): EmbedBuilder {
    return this.createEmbed(message, Colors.Green);
  }

  public static info(message: string): EmbedBuilder {
    return this.createEmbed(message, Colors.Blue);
  }

  public static warn(message: string): EmbedBuilder {
    return this.createEmbed(message, Colors.Yellow);
  }

  public static error(message: string): EmbedBuilder {
    return this.createEmbed(message, Colors.Red);
  }

  private static createEmbed(message: string, color: ColorResolvable): EmbedBuilder {
    return new EmbedBuilder().setDescription(`**${message}**`).setColor(color);
  }
}
