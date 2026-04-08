import chalk from 'chalk';
import { Client, EmbedBuilder, TextChannel } from 'discord.js'; 
import { ExtendedClient } from '../structures/Client.js';
import { Embeds } from './Embeds.js';
import { Constants } from './Constants.js';

export class Logger {
  public static success(message: string): void {
    this.log(message, chalk.green);
  }

  public static info(message: string): void {
    this.log(message, chalk.blue);
  }

  public static warn(message: string): void {
    this.log(message, chalk.yellow);
  }

  public static error(message: string): void {
    this.log(message, chalk.red);
  }

  private static log(message: string, colorFn: (text: string) => string): void {
    const timestamp = this.formatTimestamp();
    console.log(colorFn(`[${timestamp}] ${message}`));
  }

  private static formatTimestamp(): string {
    const now = new Date();

    return [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map((v) => String(v).padStart(2, '0'))
      .join(':');
  }

  public static async discordLog(message: string, client: ExtendedClient): Promise<void> {
    try {
      const channels = (client as Client).channels; 
      const channel = await channels.fetch(Constants.CHANNELS.BOT_ERRORS);

      if (!channel || !channel.isTextBased()) return;
      const embed = Embeds.error(message)
      await (channel as TextChannel).send({embeds: [embed]}) // FUCK TYPESCRIPT
    } catch (error) {}
  }
}
