import chalk from 'chalk';
import { Embeds } from './Embeds.js';
import Constants from './Constants.js';
export class Logger {
    static success(message) {
        this.log(message, chalk.green);
    }
    static info(message) {
        this.log(message, chalk.blue);
    }
    static warn(message) {
        this.log(message, chalk.yellow);
    }
    static error(message) {
        this.log(message, chalk.red);
    }
    static log(message, colorFn) {
        const timestamp = this.formatTimestamp();
        console.log(colorFn(`[${timestamp}] ${message}`));
    }
    static formatTimestamp() {
        const now = new Date();
        return [now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()]
            .map((v) => String(v).padStart(2, '0'))
            .join(':');
    }
    static async logErrorWithBot(message, guild) {
        const channel = await guild.channels.fetch(Constants.channels.errors);
        try {
            if (!channel || !channel.isTextBased()) {
                return;
            }
            await channel.send({
                embeds: [Embeds.error(message)],
            });
        }
        catch (error) {
            Logger.error(`Failed to send error message: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
