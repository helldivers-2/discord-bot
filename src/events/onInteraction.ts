import {Interaction} from 'discord.js';
import {
  campaignAutoCmds,
  commandHash,
  ephemeralCmds,
  modalCmds,
  ownerCmds,
  planetAutoCmds,
} from '../commands';
import {
  checkPerms,
  commandErrorEmbed,
  logger,
  ownerCommandEmbed,
} from '../handlers';
import {go as search} from 'fuzzysort';
import {mappedNames} from '../api-wrapper';

// define fuzzy search options
const searchOpts = {
  all: true, // if search empty, return all options
  limit: 25, // limit results to 25
  threshold: -1000, // don't return bad matches
};

const onInteraction = async (interaction: Interaction) => {
  if (interaction.isAutocomplete()) {
    if (planetAutoCmds.includes(interaction.commandName)) {
      await interaction.respond(
        search(
          interaction.options.getFocused(),
          mappedNames.planets,
          searchOpts
        )
          .map(result => result.target)
          .map(choice => ({name: choice, value: choice}))
      );
    }
    if (campaignAutoCmds.includes(interaction.commandName)) {
      await interaction.respond(
        search(
          interaction.options.getFocused(),
          mappedNames.campaignPlanets,
          searchOpts
        )
          .map(result => result.target)
          .map(choice => ({name: choice, value: choice}))
      );
    }
    // for future use
  } else if (interaction.isModalSubmit()) {
    // for future use
  } else if (interaction.isCommand()) {
    // wrap ALL commands for error handling -- gives user feedback if there's an issue
    try {
      // we do a little instrumentation
      const start = Date.now();
      const {commandName: command, user} = interaction;

      // Discord requires acknowledgement within 3 seconds, so just defer reply for non-modal cmds
      // Modals require a response with the modal itself, then a (potentially deferred) response to modal submission
      if (!modalCmds.includes(command))
        await interaction.deferReply({
          ephemeral: ephemeralCmds.includes(command),
        });

      // check if user has required permissions for elevated commands
      if (ownerCmds.includes(command) && !(await checkPerms(user.id)).owner) {
        await interaction.editReply(ownerCommandEmbed(interaction));
        return;
      }
      // if (adminCmds.includes(command) && !(await checkPerms(user.id)).admin) {
      //   await interaction.editReply(adminCommandEmbed(interaction));
      //   return;
      // }
      // if (teamCmds.includes(command) && !(await checkPerms(user.id)).team) {
      //   await interaction.editReply(adminCommandEmbed(interaction));
      //   return;
      // }
      await commandHash[command](interaction);

      const time = `${Date.now() - start}ms`;
      logger.info(`Executed command /${command} in ${time}`, {
        time,
        command,
        type: 'command',
        user: interaction.user.tag,
        guild: interaction.guildId,
      });

      return;
    } catch (err) {
      // typecasting for safety. we know it's a type of error
      const error = err as Error;
      // TODO: handle other error types explicitly eg. discordjs

      // Log error and additional info for debugging
      logger.info(error.message, {
        command: interaction.commandName,
        args: interaction.options.data,
        user: interaction.user.tag,
        guild: interaction.guildId,
        replied: interaction.replied,
        stack: error.stack,
        ...error,
      });

      // edit interaction response to notify players error happened
      if (interaction.deferred)
        await interaction.editReply(commandErrorEmbed(interaction));
      else await interaction.reply(commandErrorEmbed(interaction));
    }
  }
};

export {onInteraction};
