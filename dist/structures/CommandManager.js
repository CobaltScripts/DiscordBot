import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { REST, Routes } from 'discord.js';
import { Command } from './Command.js';
import { Logger } from '../utils/Logger.js';
export class CommandManager {
    commands = new Map();
    client;
    constructor(client) {
        this.client = client;
    }
    async loadCommands(commandsDirectory) {
        const commandFiles = await this.getCommandFiles(commandsDirectory);
        const separator = ', ';
        let loadedCommands = '';
        for (const commandPath of commandFiles) {
            const commandModule = await import(pathToFileURL(commandPath).href);
            if (!commandModule.default) {
                continue;
            }
            const command = new commandModule.default();
            if (!(command instanceof Command)) {
                continue;
            }
            this.commands.set(command.name, command);
            loadedCommands += command.name + separator;
        }
        Logger.info(`Loaded commands: ${loadedCommands.slice(0, 0 - separator.length)}`);
    }
    async getCommandFiles(directory) {
        const entries = await readdir(directory, { withFileTypes: true });
        const commandFiles = [];
        for (const entry of entries) {
            const entryPath = join(directory, entry.name);
            if (entry.isDirectory()) {
                commandFiles.push(...(await this.getCommandFiles(entryPath)));
                continue;
            }
            if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.ts'))) {
                commandFiles.push(entryPath);
            }
        }
        return commandFiles;
    }
    async registerSlashCommands() {
        const slashCommands = Array.from(this.commands.values()).map((cmd) => cmd.buildSlashCommand().toJSON());
        const rest = new REST({ version: '10' }).setToken(this.client.token);
        try {
            Logger.info(`Registering ${slashCommands.length} slash commands...`);
            await rest.put(Routes.applicationCommands(this.client.user.id), {
                body: slashCommands,
            });
            Logger.success('Slash commands registered globally');
        }
        catch (error) {
            Logger.error(`Failed to register slash commands: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    getCommand(name) {
        return this.commands.get(name.toLowerCase());
    }
}
