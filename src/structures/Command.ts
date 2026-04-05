import {
  ChatInputCommandInteraction,
  Message,
  SlashCommandBuilder,
  MessageCreateOptions,
  InteractionReplyOptions,
  InteractionEditReplyOptions,
  MessageEditOptions,
} from 'discord.js';
import { ExtendedClient } from './Client.js';
import { Argument, ArgumentType } from './Argument.js';

export interface CommandOptions {
  name: string;
  description: string;
  args?: Argument[];
}

export interface CommandContext {
  client: ExtendedClient;
  interaction?: ChatInputCommandInteraction;
  message?: Message;
  args: Record<string, string | number | boolean | object | null | undefined>;
  reply(content: string | MessageCreateOptions | InteractionReplyOptions): Promise<void>;
  deferReply(ephemeral?: boolean): Promise<void>;
  editReply(content: string | MessageEditOptions | InteractionEditReplyOptions): Promise<void>;
}

export abstract class Command {
  public readonly name: string;
  public readonly description: string;
  public readonly args: Argument[];

  constructor(options: CommandOptions) {
    this.name = options.name;
    this.description = options.description;
    this.args = options.args ?? [];
  }

  public buildSlashCommand(): SlashCommandBuilder {
    const builder = new SlashCommandBuilder().setName(this.name).setDescription(this.description);

    for (const arg of this.args) {
      this.addArgumentToBuilder(builder, arg);
    }

    return builder;
  }

  private addArgumentToBuilder(builder: SlashCommandBuilder, arg: Argument): void {
    const methodName = this.getBuilderMethodName(arg.type);
    const methodKey = `add${methodName}Option` as const;

    if (methodKey === 'addStringOption') {
      builder.addStringOption((option) => {
        option
          .setName(arg.name)
          .setDescription(arg.description)
          .setRequired(arg.required ?? true);

        if (arg.choices) {
          const stringChoices = arg.choices.map((c) => ({
            name: c.name,
            value: String(c.value),
          }));
          option.addChoices(...stringChoices);
        }

        return option;
      });
    } else if (methodKey === 'addNumberOption') {
      builder.addNumberOption((option) =>
        option
          .setName(arg.name)
          .setDescription(arg.description)
          .setRequired(arg.required ?? true)
      );
    } else if (methodKey === 'addBooleanOption') {
      builder.addBooleanOption((option) =>
        option
          .setName(arg.name)
          .setDescription(arg.description)
          .setRequired(arg.required ?? true)
      );
    } else if (methodKey === 'addUserOption') {
      builder.addUserOption((option) =>
        option
          .setName(arg.name)
          .setDescription(arg.description)
          .setRequired(arg.required ?? true)
      );
    } else if (methodKey === 'addRoleOption') {
      builder.addRoleOption((option) =>
        option
          .setName(arg.name)
          .setDescription(arg.description)
          .setRequired(arg.required ?? true)
      );
    } else if (methodKey === 'addChannelOption') {
      builder.addChannelOption((option) =>
        option
          .setName(arg.name)
          .setDescription(arg.description)
          .setRequired(arg.required ?? true)
      );
    }
  }

  private getBuilderMethodName(type: ArgumentType): string {
    const typeMap: Record<ArgumentType, string> = {
      string: 'String',
      number: 'Number',
      boolean: 'Boolean',
      user: 'User',
      role: 'Role',
      channel: 'Channel',
    };

    return typeMap[type];
  }

  public abstract execute(context: CommandContext): Promise<void>;

  public createContext(
    client: ExtendedClient,
    args: Record<string, string | number | boolean | object | null | undefined>,
    interaction?: ChatInputCommandInteraction,
    message?: Message
  ): CommandContext {
    return {
      client,
      interaction,
      message,
      args,

      reply: async (content: string | MessageCreateOptions | InteractionReplyOptions) => {
        if (interaction) {
          const options =
            typeof content === 'string' ? { content } : (content as InteractionReplyOptions);
          if (interaction.replied) {
            await interaction.followUp(options);
          } else if (interaction.deferred) {
            await interaction.editReply(options as InteractionEditReplyOptions);
          } else {
            await interaction.reply(options);
          }
        } else if (message) {
          const options =
            typeof content === 'string' ? { content } : (content as MessageCreateOptions);
          await message.reply(options);
        }
      },

      deferReply: async (ephemeral = false) => {
        if (interaction && !interaction.replied && !interaction.deferred) {
          await interaction.deferReply({ ephemeral });
        }
      },

      editReply: async (content: string | MessageEditOptions | InteractionEditReplyOptions) => {
        if (interaction) {
          const options =
            typeof content === 'string' ? { content } : (content as InteractionEditReplyOptions);
          await interaction.editReply(options);
        } else if (message) {
          const options =
            typeof content === 'string' ? { content } : (content as MessageEditOptions);
          await message.edit(options);
        }
      },
    };
  }

  public parseChatArgs(
    argStrings: string[]
  ): Record<string, string | number | boolean | null | undefined> {
    const parsed: Record<string, string | number | boolean | null | undefined> = {};

    for (let i = 0; i < this.args.length && i < argStrings.length; i++) {
      const arg = this.args[i];
      const value = argStrings[i];

      parsed[arg.name] = this.parseArgumentValue(arg.type, value);
    }

    for (const arg of this.args) {
      if (arg.required && parsed[arg.name] === undefined) {
        throw new Error(`Missing required argument: ${arg.name}`);
      }
    }

    return parsed;
  }

  private parseArgumentValue(type: ArgumentType, value: string): string | number | boolean {
    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value.toLowerCase() === 'true';
      case 'user':
      case 'role':
      case 'channel': {
        const match = value.match(/\d+/);
        return match ? match[0] : value;
      }
      default:
        return value;
    }
  }
}
