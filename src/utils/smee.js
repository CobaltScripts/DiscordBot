import { logger } from './logger.js';
import { EmbedBuilder } from 'discord.js';
import express from 'express';
import SmeeClient from 'smee-client';
import constants from './constants.js';

/**
 *
 * @param {import("../client/bot.js").Bot} client
 * @param {*} req
 * @param {*} res
 */
const handleWebhook = async (client, req, res) => {
  const payload = req.body;
  const repoName = payload.repository?.name;
  const branch = payload.ref
    ? payload.ref.replace('refs/heads/', '')
    : null;

  let allAddedFiles = [];
  let allModifiedFiles = [];
  let allRemovedFiles = [];
  let authors = new Set();

  payload.commits.forEach((commit) => {
    if (commit.author && commit.author.name) {
      authors.add(commit.author.name);
    }

    allAddedFiles.push(...commit.added);
    allModifiedFiles.push(...commit.modified);
    allRemovedFiles.push(...commit.removed);
  });

  const firstCommit = payload.commits[0] || {};
  const commitMessage = firstCommit.message || '';
  const commitTimeUTC = firstCommit.timestamp
    ? `<t:${Math.floor(new Date(firstCommit.timestamp).getTime() / 1000)}:R>`
    : 'Unknown';

  const fileTypeCount = {};
  const fileList = [...allAddedFiles, ...allModifiedFiles];

  fileList.forEach((filename) => {
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

    fileTypeCount[ext] = (fileTypeCount[ext] || 0) + 1;
  });

  const fileTypesSummary = Object.entries(fileTypeCount)
    .map(([type, count]) => `${type} (${count})`)
    .join(', ');

  const embed = new EmbedBuilder()
    .setTitle(`🚀 New Commit to ${repoName}`)
    .setURL(
      `https://github.com/${payload.repository.full_name}/commit/${payload.after}`,
    )
    .addFields([
      {
        name: '📝 Commit Message',
        value: commitMessage || 'No commit message',
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
        value: `Branch: ${branch || 'Unknown'}\nTime: ${commitTimeUTC || 'Unknown'}`,
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

  const channel = await client.channels.fetch(
    constants.COMMIT_CHANNEL_ID,
  );

  if (channel) {
    await channel.send({
      embeds: [embed],
      // content: `<@&${constants.COMMIT_ROLE_ID}>`,
    });
  }

  res.status(200).send('Webhook received and processed');
};

export const startSmeeClient = (client) => {
  new SmeeClient({
    source: process.env.WEBHOOK_URL,
    target: 'http://localhost:3000/webhook',
    logger: {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    },
  }).start();

  const app = express();

  app.use(express.json());
  app.post('/webhook', async (req, res) => {
    await handleWebhook(client, req, res);
  });

  app.listen(3000, () => {
    logger.info('SmeeClient listening on port 3000');
  });
};
