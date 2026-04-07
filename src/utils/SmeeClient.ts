import express, { type Request, type Response } from 'express';
import SmeeWebhookClient from 'smee-client';
import { EmbedBuilder } from 'discord.js';
import { ExtendedClient } from '../structures/Client.js';
import { Logger } from './Logger.js';

interface GitHubCommitAuthor {
  name?: string;
}

interface GitHubCommit {
  author?: GitHubCommitAuthor;
  added?: string[];
  modified?: string[];
  removed?: string[];
  message?: string;
  timestamp?: string;
}

interface GitHubPushPayload {
  repository?: {
    name?: string;
    full_name?: string;
  };
  ref?: string;
  after?: string;
  commits?: GitHubCommit[];
}

export interface SmeeClientOptions {
  source: string;
  target: string;
  channelId: string;
  port: number;
}

export class SmeeClient {
  private readonly source?: string;
  private readonly target: string;
  private readonly channelId: string;
  private readonly port: number;

  constructor(options: SmeeClientOptions) {
    this.source = options.source;
    this.target = options.target;
    this.channelId = options.channelId;
    this.port = options.port;
  }

  public start(client: ExtendedClient): void {
    if (!this.source) {
      Logger.warn('SmeeClient is disabled because WEBHOOK_URL is not set.');
      return;
    }

    new SmeeWebhookClient({
      source: this.source,
      target: this.target,
      logger: {
        info: () => {},
        error: () => {},
      },
    }).start();

    const app = express();

    app.use(express.json());
    app.post('/webhook', async (req: Request, res: Response) => {
      await this.handleRequest(client, req, res);
    });

    app.listen(this.port, () => {
      Logger.info(`SmeeClient listening on port ${this.port}`);
    });
  }

  private async handleRequest(client: ExtendedClient, req: Request, res: Response): Promise<void> {
    const payload = req.body as GitHubPushPayload;

    if (!payload) {
      res.status(400).send('Invalid payload');
      return;
    }

    const repoName = payload.repository?.name;
    const branch = payload.ref ? payload.ref.replace('refs/heads/', '') : null;

    const allAddedFiles: string[] = [];
    const allModifiedFiles: string[] = [];
    const allRemovedFiles: string[] = [];
    const authors = new Set<string>();

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
    const commitTimeUTC = firstCommit.timestamp
      ? `<t:${Math.floor(new Date(firstCommit.timestamp).getTime() / 1000)}:R>`
      : 'Unknown';

    const fileTypeCount: Record<string, number> = {};
    const fileList = [...allAddedFiles, ...allModifiedFiles];

    for (const filename of fileList) {
      const extMatch = filename.match(/\.(\w+)$/);
      let ext = extMatch ? extMatch[1].toLowerCase() : 'other';

      if (['js', 'jsx'].includes(ext)) ext = 'JavaScript';
      else if (['java'].includes(ext)) ext = 'Java';
      else if (['kt'].includes(ext)) ext = 'Kotlin';
      else if (['py'].includes(ext)) ext = 'Python';
      else if (['ts', 'tsx'].includes(ext)) ext = 'TypeScript';
      else if (['md'].includes(ext)) ext = 'Markdown';
      else if (['json'].includes(ext)) ext = 'JSON';
      else ext = ext.charAt(0).toUpperCase() + ext.slice(1);

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

    const channel = await client.channels.fetch(this.channelId);

    if (channel?.isTextBased() && 'send' in channel) {
      await channel.send({
        embeds: [embed],
      });
    }

    res.status(200).send('Webhook received and processed');
  }
}
