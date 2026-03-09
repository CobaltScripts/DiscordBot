import {
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import constants from '../../utils/constants.js';

export default {
  name: 'admin',
  description: 'Administrator commands for server management',

  async execute(client, message, subcommand, args) {
    if (
      !message.member.permissions.has(
        PermissionFlagsBits.Administrator,
      )
    ) {
      return;
    }

    switch (subcommand) {
      case 'rrembed': {
        await reactionRoleEmbedCommand(client, message);
        break;
      }

      case 'stickymessage': {
        await handleStickyMessage(client, message, args);
        break;
      }

      default: {
        return message.reply({
          embeds: [
            errorEmbed(
              `Unknown subcommand: ${subcommand}\n\nAvailable: stickymessage, rrembed`,
            ),
          ],
        });
      }
    }
  },
};

async function handleStickyMessage(client, message, args) {
  const stickyContent = Array.isArray(args)
    ? args.join(' ')
    : typeof args === 'string'
      ? message.content.split(' ').slice(2).join(' ')
      : '';
  if (!stickyContent.trim())
    return message.reply({
      embeds: [
        errorEmbed('Usage: `.admin stickymessage <message|off>`'),
      ],
    });

  if (!client.stickyMessages) client.stickyMessages = new Map();
  if (!client.stickyCooldowns) client.stickyCooldowns = new Map();

  if (stickyContent.toLowerCase() === 'off') {
    const existing = client.stickyMessages.get(message.channel.id);
    if (existing) {
      const old = await message.channel.messages
        .fetch(existing.messageId)
        .catch(() => null);
      if (old) await old.delete().catch(() => {});
      client.stickyMessages.delete(message.channel.id);
      return message.reply({
        embeds: [
          successEmbed('Sticky message disabled for this channel.'),
        ],
      });
    }
    return message.reply({
      embeds: [
        errorEmbed('No sticky message is active in this channel.'),
      ],
    });
  }

  const existing = client.stickyMessages.get(message.channel.id);
  if (existing) {
    const old = await message.channel.messages
      .fetch(existing.messageId)
      .catch(() => null);
    if (old) await old.delete().catch(() => {});
  }

  const stickyMsg = await message.channel.send({
    content: `(**sticky message**) ${stickyContent}`,
  });
  client.stickyMessages.set(message.channel.id, {
    content: stickyContent,
    messageId: stickyMsg.id,
  });
  await message.reply({
    embeds: [
      successEmbed(
        'Sticky message created! It will repost after each message.',
      ),
    ],
  });

  if (!client.stickyListenerRegistered) {
    client.stickyListenerRegistered = true;

    client.on('messageCreate', async (msg) => {
      if (!msg.guild) return;
      const sticky = client.stickyMessages.get(msg.channel.id);
      if (!sticky) return;
      const key = msg.channel.id;
      if (client.stickyCooldowns.get(key)) return;
      client.stickyCooldowns.set(key, true);
      try {
        const old = await msg.channel.messages
          .fetch(sticky.messageId)
          .catch(() => null);
        if (old) await old.delete().catch(() => {});
        const updated = client.stickyMessages.get(msg.channel.id);
        if (!updated) return;
        const newMsg = await msg.channel.send({
          content: `(**sticky message**) ${updated.content}`,
        });
        client.stickyMessages.set(msg.channel.id, {
          content: updated.content,
          messageId: newMsg.id,
        });
      } catch (err) {
        console.error(
          `Sticky message error in #${msg.channel.name}:`,
          err,
        );
      } finally {
        setTimeout(() => client.stickyCooldowns.delete(key), 1500);
      }
    });
  }
}

async function reactionRoleEmbedCommand(client, message) {
  if (
    !message.member.permissions.has(PermissionFlagsBits.Administrator)
  ) {
    return message.reply({
      embeds: [
        errorEmbed(
          'You need Administrator permissions to use this command!',
        ),
      ],
    });
  }

  const reactionRoles = [
    {
      label: 'Updates',
      roleId: constants.ROLES.UPDATES,
      style: ButtonStyle.Secondary,
      emoji: '🔔',
    },
    {
      label: 'QOTD Ping',
      roleId: constants.ROLES.QOTD_PING,
      style: ButtonStyle.Secondary,
      emoji: '❓',
    },
  ];

  const embed = client
    .embed()
    .setTitle('Reaction Roles')
    .setDescription(
      'Click the buttons below to get or remove roles!',
    );

  const rows = [];
  for (let i = 0; i < reactionRoles.length; i += 5) {
    const row = new ActionRowBuilder();
    const chunk = reactionRoles.slice(i, i + 5);

    chunk.forEach((rr) => {
      const button = new ButtonBuilder()
        .setCustomId(`role_button:${rr.roleId}`)
        .setLabel(rr.label)
        .setStyle(rr.style);

      if (rr.emoji) {
        button.setEmoji(rr.emoji);
      }

      row.addComponents(button);
    });

    rows.push(row);
  }

  try {
    await message.channel.send({
      embeds: [embed],
      components: rows,
    });

    try {
      await message.delete();
    } catch (e) {}
  } catch (error) {
    return message.reply({
      embeds: [
        errorEmbed(
          'Failed to send reaction role embed: ' + error.message,
        ),
      ],
    });
  }
}
