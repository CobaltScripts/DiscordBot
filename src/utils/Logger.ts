import chalk from 'chalk';
import { Client, Guild, TextChannel } from 'discord.js';
import { Embeds } from './Embeds.js';
import { getDataForGuild } from '@data/DataStore.js';
import { ExtendedClient } from '@structures/Client.js';

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

  public static async logErrorWithBot(message: string, guild: Guild): Promise<void> {
    const channel = await guild.channels.fetch(getDataForGuild(guild.id).channels.errors);

    try {
      if (!channel || !channel.isTextBased()) {
        return;
      }

      await channel.send({
        embeds: [Embeds.error(message)],
      });
    } catch (error) {
      Logger.error(
        `Failed to send error message: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
