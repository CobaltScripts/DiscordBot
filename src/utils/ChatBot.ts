import { ApiError, GoogleGenAI } from '@google/genai';
import { readFileSync } from 'node:fs';
import { Logger } from './Logger.js';
import { ExtendedClient } from '../structures/Client.js';
import { Constants } from './Constants.js';
import ollama from 'ollama';

type ChatAuthor = {
  id: string;
  username: string;
};

export class ChatBot {
  private apiKey: string;
  private client: GoogleGenAI;
  private context = '';
  private chat: ReturnType<GoogleGenAI['chats']['create']> | null = null;
  public useLocalLLM: boolean = false;

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
    try {
      this.context = readFileSync(new URL('../../data/context.txt', import.meta.url), 'utf8').toString() || '';
    } catch (e) {
      this.context = "You are a helpful assistant.";
    }

    this.chat = this.client.chats.create({
      model: 'gemini-2.0-flash-lite',
      config: {
        systemInstruction: this.context,
      },
    });
  }

  public async generateResponse(message: string, author: ChatAuthor, client: ExtendedClient): Promise<string> {
    if (this.useLocalLLM) {
      return await this.generateLocalResponse(message, author, client);
    }

    if (!this.chat) return 'i errored :/ (no chat?)';

    try {
      const response = await this.chat.sendMessage({
        message: `[Discord Id: ${author.id}, Discord Name: ${author.username}] says "${message}"`,
      });

      return response.text ?? 'i errored :/';
    } catch (error: any) {
      let cleanMessage = error.message;
      if (error.message?.includes('{')) {
          try {
              const parsed = JSON.parse(error.message.substring(error.message.indexOf('{')));
              cleanMessage = parsed.error?.message || "Quota Exceeded/API Error";
          } catch {
              cleanMessage = error.message.split('\n')[0];
          }
      }

      void Logger.discordLog(
        `Error generating response: ${cleanMessage}`,
        client
      );
      return 'i errored :/ (see <#' + Constants.CHANNELS.BOT_ERRORS + '>)';
    }
  }

  private async generateLocalResponse(message: string, author: ChatAuthor, client: ExtendedClient): Promise<string> {
    try {
      const response = await ollama.chat({
        model: 'qwen2.5:0.5b',
        messages: [
          { role: 'system', content: this.context },
          { role: 'user', content: `[Discord Id: ${author.id}, Discord Name: ${author.username}] says "${message}"` }
        ],
        keep_alive: "5m",
        options: {
            num_ctx: 2048
        }
      });

      return response.message.content;
    } catch (error) {
      void Logger.discordLog(`Local LLM Error: ${error instanceof Error ? error.message : String(error)}`, client);
      return 'local ai errored (is ollama running?)';
    }
  }
}
