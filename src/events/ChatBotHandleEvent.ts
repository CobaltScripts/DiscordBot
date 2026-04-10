import { Event } from '@structures/Event.js';
import { ExtendedClient } from '@structures/Client.js';
import { Message, PermissionFlagsBits } from 'discord.js';

export default class ChatBotHandleEvent extends Event<'messageCreate'> {
  constructor() {
    super({
      name: 'messageCreate',
    });
  }

  public async execute(client: ExtendedClient, message: Message): Promise<void> {
    const botUser = client.user;

    if (!botUser) {
      return;
    }

    if (message.author.bot || !message.inGuild() || !message.channel.name.includes('ai-chat')) {
      return;
    }

    if (!message.mentions.has(botUser)) {
      return;
    }

    const content = message.content.trim().toLowerCase();

    if (content === `<@!${botUser.id}>` || content === `<@${botUser.id}>`) {
      return;
    }

    if (
      message.member?.permissions.has(PermissionFlagsBits.Administrator) &&
      content.includes('dev reset')
    ) {
      client.chatBot.reset();

      await message.reply({
        content: 'Sir yes sir! 🫡',
        allowedMentions: { repliedUser: false },
      });

      return;
    }

    await message.channel.sendTyping();

    const res = await client.chatBot.generateResponse(content, message.author);

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
  }
}
