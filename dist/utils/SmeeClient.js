import express from 'express';
import SmeeWebhookClient from 'smee-client';
import { EmbedBuilder } from 'discord.js';
import { Logger } from './Logger.js';
import Constants from './Constants.js';
export class SmeeClient {
    source;
    target;
    channelId;
    port;
    constructor(options) {
        this.source = options.source;
        this.target = options.target;
        this.channelId = options.channelId;
        this.port = options.port;
    }
    start(client) {
        if (!this.source) {
            Logger.warn('SmeeClient is disabled because WEBHOOK_URL is not set.');
            return;
        }
        new SmeeWebhookClient({
            source: this.source,
            target: this.target,
            logger: {
                info: () => { },
                error: () => { },
            },
        }).start();
        const app = express();
        app.use(express.json());
        app.post('/webhook', async (req, res) => {
            await this.handleRequest(client, req, res);
        });
        app.listen(this.port, () => {
            Logger.info(`SmeeClient listening on port ${this.port}`);
        });
    }
    async handleRequest(client, req, res) {
        const payload = req.body;
        if (!payload) {
            Logger.error('Invalid payload');
            res.status(400).send('Invalid payload');
            return;
        }
        const repoName = payload.repository?.name;
        const branch = payload.ref ? payload.ref.replace('refs/heads/', '') : null;
        const allAddedFiles = [];
        const allModifiedFiles = [];
        const allRemovedFiles = [];
        const authors = new Set();
        for (const commit of payload.commits ?? []) {
            if (commit.author?.name) {
                authors.add(commit.author.name);
            }
            allAddedFiles.push(...(commit.added ?? []));
            allModifiedFiles.push(...(commit.modified ?? []));
            allRemovedFiles.push(...(commit.removed ?? []));
        }
        const firstCommit = payload.commits?.[0] ?? {};
        const commitMessage = firstCommit.message || 'No commit message';
        let commitTimeUTC;
        if (firstCommit.timestamp) {
            commitTimeUTC = `<t:${Math.floor(new Date(firstCommit.timestamp).getTime() / 1000)}:R>`;
        }
        else {
            Logger.error('No timestamp found');
            res.status(200).send('No timestamp found');
            return;
        }
        const fileTypeCount = {};
        const fileList = [...allAddedFiles, ...allModifiedFiles];
        for (const filename of fileList) {
            const extMatch = filename.match(/\.(\w+)$/);
            let ext = extMatch ? extMatch[1].toLowerCase() : 'other';
            if (['js', 'jsx'].includes(ext))
                ext = 'JavaScript';
            else if (['java'].includes(ext))
                ext = 'Java';
            else if (['kt'].includes(ext))
                ext = 'Kotlin';
            else if (['py'].includes(ext))
                ext = 'Python';
            else if (['ts', 'tsx'].includes(ext))
                ext = 'TypeScript';
            else if (['md'].includes(ext))
                ext = 'Markdown';
            else if (['json'].includes(ext))
                ext = 'JSON';
            else
                ext = ext.charAt(0).toUpperCase() + ext.slice(1);
            fileTypeCount[ext] = (fileTypeCount[ext] ?? 0) + 1;
        }
        const fileTypesSummary = Object.entries(fileTypeCount)
            .map(([type, count]) => `${type} (${count})`)
            .join(', ');
        const embed = new EmbedBuilder()
            .setTitle(`🚀 New Commit to ${repoName ?? 'Unknown Repo'}`)
            .setURL(`https://github.com/${payload.repository?.full_name}/commit/${payload.after}`)
            .addFields([
            {
                name: '📝 Commit Message',
                value: commitMessage,
                inline: false,
            },
            {
                name: '📊 Files Changed',
                value: `**\`+${allAddedFiles.length}\`** added\n**\`-${allRemovedFiles.length}\`** removed\n**\`±${allModifiedFiles.length}\`** modified`,
                inline: true,
            },
            {
                name: '',
                value: '',
                inline: true,
            },
            {
                name: '💡 Details',
                value: `Branch: ${branch || 'Unknown'}\nTime: ${commitTimeUTC}`,
                inline: true,
            },
            {
                name: '📁 File Types',
                value: fileTypesSummary || 'No files',
                inline: true,
            },
            {
                name: '👤 Author(s)',
                value: Array.from(authors).join(', ') || 'Unknown',
                inline: true,
            },
        ])
            .setColor(0x4682b4);
        const guild = client.guilds.cache.get(Constants.guildId);
        const channel = guild?.channels.cache.get(this.channelId);
        if (channel?.isTextBased()) {
            await channel.send({
                embeds: [embed],
            });
        }
        res.status(200).send('Webhook received and processed');
    }
}
