import { ApiError, GoogleGenAI } from '@google/genai';
import { readFileSync } from 'node:fs';
import { Logger } from './Logger.js';
import { ExtendedClient } from '../structures/Client.js';
import { Constants } from './Constants.js';

type ChatAuthor = {
  id: string;
  username: string;
};

export class ChatBot {
  private apiKey: string;
  private client: GoogleGenAI;
  private context = '';
  private chat: ReturnType<GoogleGenAI['chats']['create']> | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = new GoogleGenAI({ apiKey });
    this.reset();
  }

  public updateKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.client = new GoogleGenAI({ apiKey });
    this.reset();
  }

  public reset(): void {
    this.context =
      readFileSync(new URL('../../data/context.txt', import.meta.url), 'utf8').toString() || '';

    this.chat = this.client.chats.create({
      model: 'gemini-2.5-flash-lite',
      config: {
        systemInstruction: this.context,
      },
    });
  }

  public async generateResponse(message: string, author: ChatAuthor, client: ExtendedClient): Promise<string> {
    if (!this.chat) {
      return 'i errored :/ (no chat?)';
    }

    try {
      const response = await this.chat.sendMessage({
        message: `[Discord Id: ${author.id}, Discord Name: ${author.username}] says "${message}"`,
      });

      return response.text ?? 'i errored :/';
    } catch (error) {
      Logger.discordLog(
        `Error generating response: ${error instanceof ApiError ? error.message : String(error)}`,
        client
      );
      return 'i errored :/ (see <#' + Constants.CHANNELS.BOT_ERRORS + '>)';
    }
  }
}
