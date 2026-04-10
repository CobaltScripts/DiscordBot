import { Event } from '@structures/Event.js';
import { ExtendedClient } from '@structures/Client.js';
import { Message, PermissionFlagsBits } from 'discord.js';
import homoglyphSearch from 'homoglyph-search';

const scamKeywords = [
  'steamcommunity',
  'gift',
  'discordapp',
  'nitro',
  'free',
  'giveaway',
  '1.png',
  '2.png',
  '3.png',
  '4.png',
  '1.jpg',
  '2.jpg',
  '3.jpg',
  '4.jpg',
  'image.png',
];

export default class HackedAccountHandleEvent extends Event<'messageCreate'> {
  constructor() {
    super({
      name: 'messageCreate',
    });
  }

  public async execute(client: ExtendedClient, message: Message): Promise<void> {
    if (message.author.bot) return;
    if (!message.inGuild() || !message.member) return;

    const content = message.content.toLowerCase();

    if (
      (content.includes('@everyone') || content.includes('@here')) &&
      !message.member.permissions.has(PermissionFlagsBits.MentionEveryone)
    ) {
      if (homoglyphSearch.search(content, scamKeywords).length !== 0) {
        const reply = await message.channel.send({
          content: `<@${message.author.id}> Your message was removed because it contained everyone/here mentions and potentially scam-related content. Please avoid sending such messages in the future.`,
        });

        setTimeout(() => {
          void reply.delete().catch(() => {});
        }, 3_000);

        await message.delete().catch(() => {});
      }
    }
  }
}
