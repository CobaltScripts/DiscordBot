import {
  ChatInputCommandInteraction,
  Guild,
  Message,
  SlashCommandBuilder,
  MessageCreateOptions,
  InteractionReplyOptions,
  InteractionEditReplyOptions,
  MessageEditOptions,
  PermissionResolvable,
  PermissionsBitField,
} from 'discord.js';
import { ExtendedClient } from './Client.js';
import { Argument, ArgumentType } from './Argument.js';
import { Utils } from '../utils/Utils.js';

export interface CommandOptions {
  name: string;
  description: string;
  args?: Argument[];
  requiredPermissions?: PermissionResolvable[];
}

export interface CommandContext {
  client: ExtendedClient;
  interaction?: ChatInputCommandInteraction;
  message?: Message;
  args: Record<string, string | number | boolean | object | null | undefined>;
  reply(content: string | MessageCreateOptions | InteractionReplyOptions): Promise<void>;
  deferReply(ephemeral?: boolean): Promise<void>;
  editReply(content: string | MessageEditOptions | InteractionEditReplyOptions): Promise<void>;
  replyMessage?: Message;
}

export abstract class Command {
  public readonly name: string;
  public readonly description: string;
  public readonly args: Argument[];
  public readonly requiredPermissions: PermissionResolvable[];

  constructor(options: CommandOptions) {
    this.name = options.name;
    this.description = options.description;
    this.args = options.args ?? [];
    this.requiredPermissions = options.requiredPermissions ?? [];
  }

  public buildSlashCommand(): SlashCommandBuilder {
    const builder = new SlashCommandBuilder().setName(this.name).setDescription(this.description);

    if (this.requiredPermissions.length) {
      builder.setDefaultMemberPermissions(
        new PermissionsBitField(this.requiredPermissions).bitfield
      );
    }

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

  public hasRequiredPermissions(memberPermissions?: Readonly<PermissionsBitField | null>): boolean {
    if (!this.requiredPermissions.length) {
      return true;
    }

    return memberPermissions?.has(this.requiredPermissions) ?? false;
  }

  public getMissingPermissions(memberPermissions?: Readonly<PermissionsBitField | null>): string[] {
    if (!this.requiredPermissions.length) {
      return [];
    }

    const missingPermissions = this.requiredPermissions.filter(
      (permission) => !memberPermissions?.has(permission)
    );

    return new PermissionsBitField(missingPermissions).toArray();
  }

  public abstract execute(client: ExtendedClient, context: CommandContext): Promise<void>;

  public createContext(
    client: ExtendedClient,
    args: Record<string, string | number | boolean | object | null | undefined>,
    interaction?: ChatInputCommandInteraction,
    message?: Message
  ): CommandContext {
    const context: CommandContext = {
      client,
      interaction,
      message,
      args,
      reply: async (content: string | MessageCreateOptions | InteractionReplyOptions) => {
        if (interaction) {
          const options =
            typeof content === 'string' ? { content } : (content as InteractionReplyOptions);
          options.allowedMentions = { repliedUser: false };
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
          options.allowedMentions = { repliedUser: false };
          context.replyMessage = await message.reply(options);
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
        } else if (context.replyMessage) {
          const options =
            typeof content === 'string' ? { content } : (content as MessageEditOptions);
          await context.replyMessage.edit(options);
        }
      },
    };
    return context;
  }

  public async parseChatArgs(
    argStrings: string[],
    guild?: Guild
  ): Promise<Record<string, string | number | boolean | object | null | undefined>> {
    const parsed: Record<string, string | number | boolean | object | null | undefined> = {};

    for (let i = 0; i < this.args.length && i < argStrings.length; i++) {
      const arg = this.args[i];
      const value = argStrings[i];

      parsed[arg.name] = await this.parseArgumentValue(arg.type, value, guild);

      if (
        (arg.type === 'user' || arg.type === 'role' || arg.type === 'channel') &&
        parsed[arg.name] === null
      ) {
        throw new Error(`Invalid ${arg.type} argument: ${value}`);
      }
    }

    for (const arg of this.args) {
      if (arg.required && parsed[arg.name] === undefined) {
        throw new Error(`Missing required argument: ${arg.name}`);
      }
    }

    return parsed;
  }

  private async parseArgumentValue(
    type: ArgumentType,
    value: string,
    guild?: Guild
  ): Promise<string | number | boolean | object | null> {
    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value.toLowerCase() === 'true';
      case 'user':
        return guild ? await Utils.findMember(guild, value) : (value.match(/\d+/)?.[0] ?? value);
      case 'role':
        return guild ? await Utils.findRole(guild, value) : (value.match(/\d+/)?.[0] ?? value);
      case 'channel':
        return guild ? await Utils.findChannel(guild, value) : (value.match(/\d+/)?.[0] ?? value);
      default:
        return value;
    }
  }
}
