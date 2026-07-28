import { Mistral } from '@mistralai/mistralai';
import { readFileSync } from 'node:fs';
export class ChatBot {
    static MAX_USER_MESSAGE_CHARS = 280;
    static MAX_TURNS_BEFORE_RESET = 8;
    static MODEL = 'devstral-medium-latest';
    context = '';
    mistral;
    messages = [];
    turnsSinceReset = 0;
    constructor(apiKey) {
        this.mistral = new Mistral({ apiKey });
        this.reset();
    }
    updateKey(apiKey) {
        this.mistral = new Mistral({ apiKey });
        this.reset();
    }
    reset() {
        this.context =
            readFileSync(new URL('../../resources/context.txt', import.meta.url), 'utf8').toString() ||
                '';
        this.messages = [
            {
                role: 'system',
                content: this.context,
            },
        ];
        this.turnsSinceReset = 0;
    }
    async generateResponse(message, author) {
        if (this.turnsSinceReset >= ChatBot.MAX_TURNS_BEFORE_RESET) {
            this.reset();
        }
        const trimmedMessage = message.trim().slice(0, ChatBot.MAX_USER_MESSAGE_CHARS);
        const requestMessages = [
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
    static extractText(content) {
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
