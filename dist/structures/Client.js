import { ActivityType, Client, GatewayIntentBits, Partials } from 'discord.js';
import { readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Event } from './Event.js';
import { SmeeClient } from '../utils/SmeeClient.js';
import { ChatBot } from '../utils/ChatBot.js';
import Constants from '../utils/Constants.js';
export class ExtendedClient extends Client {
    prefix;
    smeeClient;
    chatBot;
    commandManager = null;
    constructor(extendedClientOptions) {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMessageReactions,
            ],
            partials: [
                Partials.Channel,
                Partials.GuildMember,
                Partials.Message,
                Partials.User,
                Partials.Reaction,
            ],
        });
        this.prefix = extendedClientOptions.prefix;
        this.chatBot = new ChatBot(extendedClientOptions.mistralApiKey);
        this.smeeClient = new SmeeClient({
            source: extendedClientOptions.smeeUrl,
            channelId: Constants.channels.commits,
            target: 'http://localhost:6242/webhook',
            port: 6242,
        });
        void this.start(extendedClientOptions);
    }
    async updatePresence() {
        const cobaltGuild = this.guilds.cache.find((guild) => {
            return guild.id == Constants.guildId;
        });
        let activity = {
            name: 'Sniffing glue',
            type: ActivityType.Custom,
            state: 'Sniffing glue',
        };
        if (cobaltGuild) {
            try {
                await cobaltGuild.members.fetch();
            }
            catch { }
            const humanCount = cobaltGuild.members.cache.size > 0
                ? cobaltGuild.members.cache.filter((member) => !member.user?.bot).size
                : (cobaltGuild.memberCount ?? 0);
            activity = {
                name: `${humanCount} members`,
                type: ActivityType.Watching,
            };
        }
        this.user?.setPresence({
            status: 'dnd',
            activities: [activity],
        });
    }
    async start(extendedClientOptions) {
        this.chatBot.reset();
        await this.registerEvents();
        await this.login(extendedClientOptions.token);
    }
    async registerEvents() {
        const eventsDirectory = join(dirname(fileURLToPath(import.meta.url)), '..', 'events');
        const eventFiles = await this.getEventFiles(eventsDirectory);
        for (const eventPath of eventFiles) {
            const eventModule = await import(pathToFileURL(eventPath).href);
            if (!eventModule.default) {
                continue;
            }
            const event = new eventModule.default();
            if (!(event instanceof Event)) {
                continue;
            }
            if (event.once) {
                this.once(event.name, (...args) => {
                    void event.execute(this, ...args);
                });
            }
            else {
                this.on(event.name, (...args) => {
                    void event.execute(this, ...args);
                });
            }
        }
    }
    async getEventFiles(directory) {
        const entries = await readdir(directory, { withFileTypes: true });
        const eventFiles = [];
        for (const entry of entries) {
            const fullPath = join(directory, entry.name);
            if (entry.isDirectory()) {
                eventFiles.push(...(await this.getEventFiles(fullPath)));
                continue;
            }
            if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.ts'))) {
                eventFiles.push(fullPath);
            }
        }
        return eventFiles;
    }
}
