import { GoogleGenAI } from '@google/genai';
import { readFileSync } from 'fs';
import { logger } from './logger.js';

export class ChatBot {
  constructor(apiKey) {
    this.client = new GoogleGenAI({ apiKey });
  }

  reset() {
    this.context =
      readFileSync(
        new URL('../../data/context.txt', import.meta.url),
      ).toString() || '';

    this.chat = this.client.chats.create({
      model: 'gemini-2.5-flash-lite',
      config: {
        systemInstruction: this.context,
      },
    });
  }

  async generateResponse(message, author) {
    if (!this.client) {
      return 'i errored :/';
    }

    try {
      const response = await this.chat.sendMessage({
        message: `[Discord Id: ${author.id}, Discord Name: ${author.username}] says "${message}"`,
      });

      return response.text;
    } catch (error) {
      logger.error(`Error generating response: ${error}`);
      return 'i errored :/';
    }
  }
}
