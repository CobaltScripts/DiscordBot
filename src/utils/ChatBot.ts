import { Mistral } from '@mistralai/mistralai';
import { readFileSync } from 'node:fs';
import { ExtendedClient } from '@structures/Client.js';
import { Constants } from '@utils/Constants.js';

type ChatAuthor = {
  id: string;
  username: string;
};

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export class ChatBot {
  private static readonly MAX_USER_MESSAGE_CHARS = 280;
  private static readonly MAX_TURNS_BEFORE_RESET = 8;
  private static readonly MODEL = 'devstral-medium-latest';

  private context = '';
  private bot: ExtendedClient;
  private mistral: Mistral;
  private messages: ChatMessage[] = [];
  private turnsSinceReset = 0;

  constructor(bot: ExtendedClient, apiKey: string) {
    this.bot = bot;
    this.mistral = new Mistral({ apiKey });
    this.reset();
  }

  public updateKey(apiKey: string): void {
    this.mistral = new Mistral({ apiKey });
    this.reset();
  }

  public reset(): void {
    this.context =
      readFileSync(new URL('../../data/context.txt', import.meta.url), 'utf8').toString() || '';

    this.messages = [
      {
        role: 'system',
        content: this.context,
      },
    ];

    this.turnsSinceReset = 0;
  }

  public async generateResponse(message: string, author: ChatAuthor): Promise<string> {
    if (this.turnsSinceReset >= ChatBot.MAX_TURNS_BEFORE_RESET) {
      this.reset();
    }

    try {
      const trimmedMessage = message.trim().slice(0, ChatBot.MAX_USER_MESSAGE_CHARS);
      const requestMessages: ChatMessage[] = [
        ...this.messages,
        {
          role: 'user',
          content: `u:${author.username} id:${author.id} m:${trimmedMessage}`,
        },
      ];

      const response = await this.mistral.chat.complete({
        model: ChatBot.MODEL,
        messages: requestMessages,
        temperature: 0.2,
        topP: 0.7,
        maxTokens: 64,
        responseFormat: {
          type: 'text',
        },
      });

      const rawResponse = response.choices[0]?.message?.content;
      const responseText = ChatBot.extractText(rawResponse);

      this.messages = requestMessages;

      if (responseText) {
        this.messages.push({
          role: 'assistant',
          content: responseText,
        });
      }

      this.turnsSinceReset += 1;

      return responseText ?? 'i errored :/';
    } catch (error: unknown) {
      const rawMessage = error instanceof Error ? error.message : String(error);
      let cleanMessage = rawMessage;

      if (rawMessage.includes('{')) {
        try {
          const parsed = JSON.parse(rawMessage.substring(rawMessage.indexOf('{'))) as {
            error?: { message?: string };
          };
          cleanMessage = parsed.error?.message || 'Quota Exceeded/API Error';
        } catch {
          cleanMessage = rawMessage.split('\n')[0];
        }
      }

      await this.bot.logError(cleanMessage);
      return `i errored :/ (see <#${Constants.CHANNELS.BOT_ERRORS}>)`;
    }
  }

  private static extractText(
    content: string | Array<{ type?: string; text?: string }> | null | undefined
  ): string {
    if (!content) {
      return '';
    }

    if (typeof content === 'string') {
      return content;
    }

    return content
      .map((chunk) => {
        return chunk.type === 'text' ? (chunk.text ?? '') : '';
      })
      .join('')
      .trim();
  }
}
