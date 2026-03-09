import { logger } from '../utils/logger.js';

export default {
  name: 'clientReady',

  async execute(client) {
    logger.info(`Client is ready! Logged in as ${client.user.tag}`);

    const commands = client.slashCommands.map((cmd) =>
      cmd.data.toJSON(),
    );

    const users = new Set();
    const guilds = await client.guilds.fetch();

    for (const [, guild] of guilds) {
      const fetchedGuild = await guild.fetch();

      try {
        await fetchedGuild.commands.set(commands);
        logger.info(
          `Successfully registered ${commands.length} slash commands for guild: ${fetchedGuild.name}`,
        );
      } catch (error) {
        logger.error(
          `Failed to register slash commands for guild ${fetchedGuild.name}: ${error}`,
        );
      }

      const members = await fetchedGuild.members.fetch();

      for (const member of members.values()) {
        if (member.user.bot) {
          continue;
        }

        users.add(member.user.id);
      }
    }

    client.user.setPresence({
      status: 'dnd',
      activities: [
        {
          name: `${users.size} members`,
          type: 3,
        },
      ],
    });
  },
};
