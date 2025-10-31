import { PermissionFlagsBits, MessageFlags } from "discord.js";
import homoglyphSearch from "homoglyph-search";

export default {
  name: 'messageCreate',

  /**
   * @param {import("../client/bot.js").Bot} client
   * @param {import("discord.js").Message} message
   */
  async execute(client, message) {
    if (
      (message.content.toLowerCase().includes('@everyone') ||
        message.content.toLowerCase().includes('@here')) &&
      !message.member.permissions.has(PermissionFlagsBits.MentionEveryone)
    ) {
      const scamKeywords = [
        "steamcommunity",
        "gift",
        "discordapp",
        "nitro",
        "free", // maybe flalse flag too, unsure ig
        "giveaway",
        "1.png",
        "2.png",
        "3.png",
        "4.png",
        "1.jpg",
        "2.jpg",
        "3.jpg",
        "4.jpg",
        "image.png" // this one MIGHT false flag but scams use it + who tf does @everyone for normal images without perms
      ];
      console.log(message.content.toLowerCase());
      if (homoglyphSearch.search(message.content.toLowerCase(), scamKeywords)) {
        await message.reply({
          content: `Your message was removed because it mentioned everyone/here mentions and contained possible scam-related content. Please refrain from such messages.`,
          flags: MessageFlags.Ephemeral
        });
        
        await message.delete();
      }
    }
    if (!message.channel.name.includes('ai-chat')) return;
    if (message.author.bot || !message.mentions.has(client.user)) {
      return;
    }

    const content = message.content.trim().toLowerCase();

    if (content === `<@!${client.user.id}>`) {
      return;
    }

    if (message.member.permissions.has(PermissionFlagsBits.Administrator) && content.includes('dev reset')) {
      client.chatBot.reset();

      return await message.reply({
        content: 'Sir yes sir! 🫡',
        allowedMentions: { repliedUser: false },
      });
    }

    await message.channel.sendTyping();
    const res = await client.chatBot.generateResponse(
      content,
      message.author,
    );

    if (!res || res.length === 0) {
      return;
    }

    const msgs = res.split('|||');

    for (const msg of msgs) {
      if (msg === msgs[0]) {
        await message.reply({
          content: msg,
          allowedMentions: {
            parse: [],
            repliedUser: false,
          },
        });
        continue;
      }

      await message.channel.send({
        content: msg.trim(),
        allowedMentions: {
          parse: [],
        },
      });
    }
  },
};
