import {
  Client,
  Collection,
  EmbedBuilder,
  GatewayIntentBits,
  Partials,
} from 'discord.js';
import { logger } from '../utils/logger.js';
import { loadFiles } from '../utils/loader.js';
import { fileURLToPath } from 'url';
import path from 'path';
import { ChatBot } from '../utils/chatBot.js';

export class Bot extends Client {
  constructor(geminiApiKey) {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
      partials: [
        Partials.Channel,
        Partials.GuildMember,
        Partials.Message,
        Partials.User,
      ],
    });

    this.prefix = '.';
    this.chatBot = new ChatBot(geminiApiKey);
    this.commands = new Collection();
  }

  async registerCommands() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const commandsPath = path.join(__dirname, '../commands');
    const commandFiles = loadFiles(commandsPath);

    for (const filePath of commandFiles) {
      const command = await import(`file://${filePath}`);

      if (
        !command.default ||
        !command.default.name ||
        !command.default.execute
      ) {
        continue;
      }

      this.commands.set(command.default.name, command.default);
    }

    logger.info(`Registered ${this.commands.size} commands.`);
  }

  async registerEvents() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const eventsPath = path.join(__dirname, '../events');
    const eventFiles = loadFiles(eventsPath);

    for (const filePath of eventFiles) {
      const event = await import(`file://${filePath}`);

      if (
        !event.default ||
        !event.default.name ||
        !event.default.execute
      ) {
        logger.error(`Invalid event file: ${filePath}`);
        continue;
      }

      this.on(event.default.name, async (...args) => {
        await event.default.execute(this, ...args);
      });
    }

    logger.info(`Registered ${eventFiles.length} events.`);
  }

  async start(token) {
    if (!token) {
      const error = 'A discord token is required to start the bot';
      logger.error(error);
      throw new Error(error);
    }

    this.chatBot.reset();

    await this.registerCommands();
    await this.registerEvents();
    await this.login(token);
  }

  embed() {
    return new EmbedBuilder().setColor(0x4682b4);
  }
}
