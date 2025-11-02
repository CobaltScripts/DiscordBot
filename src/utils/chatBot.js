import { GoogleGenAI } from '@google/genai';
import { readFileSync } from 'fs';
import { logger } from './logger.js';

export class ChatBot {
  constructor(apiKey) {
    this.client = new GoogleGenAI({ apiKey });
    this.specialMode = false;
  }

  reset() {
    try {
      const baseContext = readFileSync(
        new URL('../../data/context.txt', import.meta.url)
      ).toString();

      let finalContext = baseContext;

      if (this.specialMode) {
        const specialContext = readFileSync(
          new URL('../../data/special_context.txt', import.meta.url)
        ).toString();
        finalContext += '\n\n' + specialContext;
      }

      this.context = finalContext;

      this.chat = this.client.chats.create({
        model: 'gemini-2.5-flash-lite',
        config: {
          systemInstruction: this.context,
        },
      });
    } catch (err) {
      logger.error(`Error resetting ChatBot context: ${err}`);
      this.context = '';
    }
  }

  toggleSpecialMode() {
    this.specialMode = !this.specialMode;
    this.reset();
    return this.specialMode;
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
