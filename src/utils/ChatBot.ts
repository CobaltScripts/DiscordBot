import { Mistral } from '@mistralai/mistralai';
import { readFileSync } from 'node:fs';
import { PollData } from 'discord.js';
import { Logger } from './Logger.js';
import { ExtendedClient } from '@structures/Client.js';
import Constants from './Constants.js';

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
  private qotdContext = '';
  private qotdTopics: string[] = [];
  private client: ExtendedClient;
  private mistral: Mistral;
  private messages: ChatMessage[] = [];
  private turnsSinceReset = 0;

  constructor(client: ExtendedClient, apiKey: string) {
    this.client = client;
    this.mistral = new Mistral({ apiKey });

    this.reset();
  }

  public updateKey(apiKey: string): void {
    this.mistral = new Mistral({ apiKey });

    this.reset();
  }

  public reset(): void {
    this.context =
      readFileSync(new URL('../../resources/context.txt', import.meta.url), 'utf8').toString() ||
      '';

    this.qotdContext =
      readFileSync(
        new URL('../../resources/qotd-context.txt', import.meta.url),
        'utf8'
      ).toString() || '';

    try {
      const topicsRaw = readFileSync(
        new URL('../../resources/qotd-topics.txt', import.meta.url),
        'utf8'
      ).toString();
      this.qotdTopics = topicsRaw
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
    } catch {
      this.qotdTopics = [];
    }

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
  }

  public async generateQotdPoll(): Promise<PollData | null> {
    let result: PollData | null = null;

    try {
      const topic = this.qotdTopics.length
        ? this.qotdTopics[Math.floor(Math.random() * this.qotdTopics.length)]
        : undefined;

      const userPrompt = topic
        ? `Please reply with the JSON object described in the system message. Use this topic: "${topic}".`
        : 'Please reply with the JSON object described in the system message.';

      const response = await this.mistral.chat.complete({
        model: ChatBot.MODEL,
        messages: [
          { role: 'system', content: this.qotdContext },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.6,
        topP: 0.9,
        maxTokens: 120,
        responseFormat: { type: 'text' },
      });

      const rawContent = response.choices[0]?.message?.content ?? '';
      const rawText = ChatBot.extractText(
        rawContent as string | Array<{ type?: string; text?: string }> | null | undefined
      );

      const match = rawText.match(/\{[\s\S]*\}/);

      if (match) {
        const parsed = JSON.parse(match[0]);
        const questionText = String(parsed.question ?? 'Question of the Day');
        let choices: string[] = Array.isArray(parsed.choices)
          ? parsed.choices.map((c: unknown) => String(c ?? '').trim()).filter(Boolean)
          : [];

        choices = choices.slice(0, 10);

        const normalizeChoice = (raw: string): string => {
          const cleaned = raw
            .replace(/[\p{P}]/gu, '')
            .replace(/\s+/g, ' ')
            .trim();
          const words = cleaned.split(' ').filter(Boolean).slice(0, 3);
          return words.join(' ').trim();
        };

        choices = choices.map(normalizeChoice).filter(Boolean);

        if (choices.length >= 3 && choices.length <= 10) {
          result = {
            question: { text: questionText },
            answers: choices.map((c: string) => ({ text: c })),
            duration: 24,
            allowMultiselect: false,
          };
        }
      }
    } catch {
      Logger.logErrorWithBot(
        'Failed to generate QOTD poll',
        this.client.guilds.cache.get(Constants.guildId)!
      );
    }

    return result;
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
