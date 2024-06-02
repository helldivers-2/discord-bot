import {EmbedBuilder, Interaction} from 'discord.js';
import {
  campaignAutoCmds,
  commandHash,
  ephemeralCmds,
  itemAutoCmds,
  ownerCmds,
  planetAutoCmds,
} from '../commands';
import {
  checkPerms,
  commandErrorEmbed,
  componentErrorEmbed,
  logger,
  ownerCommandEmbed,
} from '../handlers';
import {go as search} from 'fuzzysort';
import {mappedNames} from '../api-wrapper';
import {buttonHash} from '../buttons';
import {
  channelMenuHash,
  mentionMenuHash,
  roleMenuHash,
  stringMenuHash,
  userMenuHash,
} from '../select_menus';

// define fuzzy search function for autocomplete
const fzzSearch = (focused: string, mappedNames: string[]) =>
  search(focused, mappedNames, {
    all: true, // if search empty, show all options
    limit: 25, // limit results to 25
    threshold: -1000, // don't show bad matches
  })
    .map(result => result.target)
    .map(choice => ({name: choice, value: choice}));

const onInteraction = async (interaction: Interaction) => {
  // create timestamp for logging purposes
  const start = Date.now();
  const {type} = interaction;
  logger.info(`Received interaction ${interactionTypes[type]}`, {
    type: 'interaction',
    user: interaction.user.tag,
    guild: interaction.guild?.name,
    guildId: interaction.guildId,
  });

  if (type === 2) {
    // wrap ALL commands for error handling -- gives user feedback if there's an issue
    try {
      // we do a little instrumentation
      const {commandName: command, user, options} = interaction;

      // Discord requires acknowledgement within 3 seconds, so just defer reply for commands
      await interaction.deferReply({
        ephemeral: ephemeralCmds.includes(command),
      });
      // temp flavour message while processing the interaction
      await interaction.editReply({
        embeds: [new EmbedBuilder().setTitle('Encoding transmission...')],
      });

      // check if user has required permissions for elevated commands
      if (ownerCmds.includes(command) && !(await checkPerms(user.id)).owner) {
        await interaction.editReply(ownerCommandEmbed(interaction));
      } else {
        await commandHash[command](interaction);
      }

      const time = `${Date.now() - start}ms`;
      logger.info(`Executed command /${command} in ${time}`, {
        time,
        command,
        // for commands without a subcommand, this will be either an option or undefined
        subcommand: options.data[0]?.name,
        options,
        type: 'command',
        user: interaction.user.tag,
        guild: interaction.guild?.name,
        guildId: interaction.guildId,
      });
    } catch (err) {
      // typecasting for safety. we know it's a type of error
      const error = err as Error;
      // TODO: handle other error types explicitly eg. discordjs

      // Log error and additional info for debugging
      logger.error(error.message, {
        type: 'command',
        command: interaction.commandName,
        args: interaction.options.data,
        options: interaction.options,
        user: interaction.user.tag,
        guild: interaction.guild?.name,
        guildId: interaction.guildId,
        replied: interaction.replied,
        stack: error.stack,
        ...error,
      });

      // edit command response to notify users of an error
      if (interaction.deferred)
        await interaction.editReply(commandErrorEmbed(interaction));
      else await interaction.reply(commandErrorEmbed(interaction));
    }
  }
  if (type === 3) {
    const component = interaction.componentType;
    try {
      // temp flavour message while processing the interaction
      await interaction.update({
        embeds: [new EmbedBuilder().setTitle('Encoding transmission...')],
      });
      const {customId} = interaction;
      // 0th index of the customId is the button name, so we can use that to determine what to do
      const select = customId.split('-')[0];
      if (interaction.isButton()) {
        await buttonHash[select](interaction);
      } else if (interaction.isChannelSelectMenu()) {
        await channelMenuHash[select](interaction);
      } else if (interaction.isMentionableSelectMenu()) {
        await mentionMenuHash[select](interaction);
      } else if (interaction.isRoleSelectMenu()) {
        await roleMenuHash[select](interaction);
      } else if (interaction.isStringSelectMenu()) {
        await stringMenuHash[select](interaction);
      } else if (interaction.isUserSelectMenu()) {
        await userMenuHash[select](interaction);
      }
      const time = `${Date.now() - start}ms`;
      logger.info(
        `Handled message component interaction ${componentTypes[component]} in ${time}`,
        {
          time,
          type: 'message_component',
          componentType: componentTypes[component],
          user: interaction.user.tag,
          guild: interaction.guild?.name,
          guildId: interaction.guildId,
        }
      );
    } catch (err) {
      // typecasting for safety. we know it's a type of error
      const error = err as Error;
      // TODO: handle other error types explicitly eg. discordjs

      // Log error and additional info for debugging
      logger.error(error.message, {
        ...interaction,
        ...error,
        type: 'message_component',
        componentType: componentTypes[component],
      });

      // edit interaction response to notify users of an error
      if (interaction.replied)
        await interaction.editReply(componentErrorEmbed(interaction));
      else await interaction.reply(componentErrorEmbed(interaction));
    }
  }
  if (type === 4) {
    const focused = interaction.options.getFocused();
    const {planets, campaignPlanets, armors, boosters, grenades, weapons} =
      mappedNames;

    if (planetAutoCmds.includes(interaction.commandName))
      await interaction.respond(fzzSearch(focused, planets));
    if (campaignAutoCmds.includes(interaction.commandName))
      await interaction.respond(fzzSearch(focused, campaignPlanets));

    if (itemAutoCmds.includes(interaction.commandName)) {
      const subCmd = interaction.options.data[0].name;
      if (subCmd === 'armor')
        await interaction.respond(fzzSearch(focused, armors));
      else if (subCmd === 'weapon')
        await interaction.respond(fzzSearch(focused, weapons));
      else if (subCmd === 'grenade')
        await interaction.respond(fzzSearch(focused, grenades));
      else if (subCmd === 'booster')
        await interaction.respond(fzzSearch(focused, boosters));
    }
  }
  if (type === 5) {
    if (interaction.isModalSubmit()) {
      // for future use
    }
  }

  return;
};

const componentTypes = {
  1: 'Action Row',
  2: 'Button',
  3: 'String Select',
  4: 'Text Input',
  5: 'User Select',
  6: 'Role Select',
  7: 'Mentionable Select',
  8: 'Channel Select',
};
const interactionTypes = {
  1: 'PING',
  2: 'APPLICATION_COMMAND',
  3: 'MESSAGE_COMPONENT',
  4: 'APPLICATION_COMMAND_AUTOCOMPLETE',
  5: 'MODAL_SUBMIT',
};

export {onInteraction};
