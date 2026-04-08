import { GoogleGenAI } from '@google/genai';
import { readFileSync } from 'node:fs';
import { ExtendedClient } from '../structures/Client.js';
import { Constants } from './Constants.js';

type ChatAuthor = {
  id: string;
  username: string;
};

export class ChatBot {
  private static readonly MAX_USER_MESSAGE_CHARS = 280;
  private static readonly MAX_TURNS_BEFORE_RESET = 8;

  private context = '';
  private bot: ExtendedClient;
  private googleGenAI: GoogleGenAI;
  private chat: ReturnType<GoogleGenAI['chats']['create']> | null = null;
  private turnsSinceReset = 0;

  constructor(bot: ExtendedClient, apiKey: string) {
    this.bot = bot;
    this.googleGenAI = new GoogleGenAI({ apiKey });
    this.reset();
  }

  public updateKey(apiKey: string): void {
    this.googleGenAI = new GoogleGenAI({ apiKey });
    this.reset();
  }

  public reset(): void {
    this.context =
      readFileSync(new URL('../../data/context.txt', import.meta.url), 'utf8').toString() || '';

    this.chat = this.googleGenAI.chats.create({
      model: 'gemini-2.5-flash-lite',
      config: {
        systemInstruction: this.context,
        candidateCount: 1,
        temperature: 0.2,
        topP: 0.7,
        topK: 20,
        responseMimeType: 'text/plain',
        maxOutputTokens: 64,
      },
    });

    this.turnsSinceReset = 0;
  }

  public async generateResponse(message: string, author: ChatAuthor): Promise<string> {
    if (!this.chat || this.turnsSinceReset >= ChatBot.MAX_TURNS_BEFORE_RESET) {
      this.reset();
    }

    try {
      if (!this.chat) {
        return 'i errored :/ (no chat?)';
      }

      const trimmedMessage = message.trim().slice(0, ChatBot.MAX_USER_MESSAGE_CHARS);
      const response = await this.chat.sendMessage({
        message: `u:${author.username} id:${author.id} m:${trimmedMessage}`,
      });

      this.turnsSinceReset += 1;

      return response.text ?? 'i errored :/';
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
}
