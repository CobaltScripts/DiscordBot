import { SlashCommandBuilder, PermissionsBitField, } from 'discord.js';
import { Embeds } from '../utils/Embeds.js';
import { Utils } from '../utils/Utils.js';
export var CommandCheckFlags;
(function (CommandCheckFlags) {
    CommandCheckFlags[CommandCheckFlags["None"] = 0] = "None";
    CommandCheckFlags[CommandCheckFlags["Author"] = 1] = "Author";
    CommandCheckFlags[CommandCheckFlags["Guild"] = 2] = "Guild";
})(CommandCheckFlags || (CommandCheckFlags = {}));
export class Command {
    name;
    description;
    args;
    requiredPermissions;
    checkFlags;
    constructor(options) {
        this.name = options.name;
        this.description = options.description;
        this.args = options.args ?? [];
        this.requiredPermissions = options.requiredPermissions ?? [];
        this.checkFlags = options.checkFlags;
    }
    buildSlashCommand() {
        const builder = new SlashCommandBuilder().setName(this.name).setDescription(this.description);
        if (this.requiredPermissions.length) {
            builder.setDefaultMemberPermissions(new PermissionsBitField(this.requiredPermissions).bitfield);
        }
        for (const arg of this.args) {
            this.addArgumentToBuilder(builder, arg);
        }
        return builder;
    }
    async run(client, context) {
        if (this.checkFlags & CommandCheckFlags.Author && !context.author) {
            await context.reply({
                embeds: [Embeds.error('Unable to identify the command author.')],
            });
            return;
        }
        if (this.checkFlags & CommandCheckFlags.Guild && !context.guild) {
            await context.reply({
                embeds: [Embeds.error('This command can only be used in a server.')],
            });
            return;
        }
        await this.execute(client, context);
    }
    addArgumentToBuilder(builder, arg) {
        const methodName = this.getBuilderMethodName(arg.type);
        const methodKey = `add${methodName}Option`;
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
        }
        else if (methodKey === 'addNumberOption') {
            builder.addNumberOption((option) => option
                .setName(arg.name)
                .setDescription(arg.description)
                .setRequired(arg.required ?? true));
        }
        else if (methodKey === 'addBooleanOption') {
            builder.addBooleanOption((option) => option
                .setName(arg.name)
                .setDescription(arg.description)
                .setRequired(arg.required ?? true));
        }
        else if (methodKey === 'addUserOption') {
            builder.addUserOption((option) => option
                .setName(arg.name)
                .setDescription(arg.description)
                .setRequired(arg.required ?? true));
        }
        else if (methodKey === 'addRoleOption') {
            builder.addRoleOption((option) => option
                .setName(arg.name)
                .setDescription(arg.description)
                .setRequired(arg.required ?? true));
        }
        else if (methodKey === 'addChannelOption') {
            builder.addChannelOption((option) => option
                .setName(arg.name)
                .setDescription(arg.description)
                .setRequired(arg.required ?? true));
        }
    }
    getBuilderMethodName(type) {
        const typeMap = {
            string: 'String',
            number: 'Number',
            boolean: 'Boolean',
            user: 'User',
            role: 'Role',
            channel: 'Channel',
        };
        return typeMap[type];
    }
    hasRequiredPermissions(memberPermissions) {
        if (!this.requiredPermissions.length) {
            return true;
        }
        return memberPermissions?.has(this.requiredPermissions) ?? false;
    }
    getMissingPermissions(memberPermissions) {
        if (!this.requiredPermissions.length) {
            return [];
        }
        const missingPermissions = this.requiredPermissions.filter((permission) => !memberPermissions?.has(permission));
        return new PermissionsBitField(missingPermissions).toArray();
    }
    createContext(client, args, interaction, message) {
        const context = {
            client,
            interaction,
            message,
            author: interaction?.user ?? message?.author,
            guild: interaction?.guild ?? message?.guild ?? undefined,
            args,
            reply: async (content) => {
                if (interaction) {
                    const options = typeof content === 'string' ? { content } : content;
                    options.allowedMentions = { repliedUser: false };
                    if (interaction.replied) {
                        await interaction.followUp(options);
                    }
                    else if (interaction.deferred) {
                        await interaction.editReply(options);
                    }
                    else {
                        await interaction.reply(options);
                    }
                }
                else if (message) {
                    const options = typeof content === 'string' ? { content } : content;
                    options.allowedMentions = { repliedUser: false };
                    context.replyMessage = await message.reply(options);
                }
            },
            deferReply: async (ephemeral = false) => {
                if (interaction && !interaction.replied && !interaction.deferred) {
                    await interaction.deferReply({ ephemeral });
                }
            },
            editReply: async (content) => {
                if (interaction) {
                    const options = typeof content === 'string' ? { content } : content;
                    await interaction.editReply(options);
                }
                else if (context.replyMessage) {
                    const options = typeof content === 'string' ? { content } : content;
                    await context.replyMessage.edit(options);
                }
            },
        };
        return context;
    }
    async parseChatArgs(argStrings, guild) {
        const parsed = {};
        for (let i = 0; i < this.args.length && i < argStrings.length; i++) {
            const arg = this.args[i];
            const value = argStrings[i];
            parsed[arg.name] = await this.parseArgumentValue(arg.type, value, guild);
            if ((arg.type === 'user' || arg.type === 'role' || arg.type === 'channel') &&
                parsed[arg.name] === null) {
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
    async parseArgumentValue(type, value, guild) {
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
