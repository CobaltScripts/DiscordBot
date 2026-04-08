import { PermissionFlagsBits } from 'discord.js';
import { ExtendedClient } from '../../structures/Client.js';
import { Command, CommandContext } from '../../structures/Command.js';
import { Embeds } from '../../utils/Embeds.js';
import { Argument } from '../../structures/Argument.js';

export default class ToggleLocalLLMCommand extends Command {
  constructor() {
    super({
      name: 'togglelocalllm',
      description: 'Switch between Gemini API and Local Qwen LLM',
      requiredPermissions: [PermissionFlagsBits.Administrator],
      args: [
        new Argument({
          name: 'enabled',
          description: 'True for Local Qwen, False for Gemini',
          type: 'boolean',
          required: true,
        }),
      ],
    });
  }

  public async execute(client: ExtendedClient, context: CommandContext): Promise<void> {
    const useLocal = context.args.enabled as boolean;

    client.chatBot.useLocalLLM = useLocal;

    const mode = useLocal ? 'Local LLM (Qwen 2.5 0.5B)' : 'LLM (Gemini)';

    await context.reply({
      embeds: [Embeds.success(`Chatbot mode updated to: **${mode}**`)],
    });
  }
}
