import {
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import {Command} from '../interfaces';
import {FOOTER_MESSAGE} from './_components';

const command: Command = {
  data: new SlashCommandBuilder()
    // TODO:
    .setName('COMMAND_NAME')
    // TODO:
    .setDescription('COMMAND_DESC')
    .addSubcommand(subcommand =>
      subcommand
        // TODO:
        .setName('SUBCMD_NAME')
        // TODO:
        .setDescription('SUB_CMD_DESC')
    )
    .addSubcommand(subcommand =>
      subcommand
        // TODO:
        .setName('SUBCMD_NAME')
        // TODO:
        .setDescription('SUB_CMD_DESC')
    ),
  run: async interaction => {
    // TODO: perform any checks if needed (eg. perm checks)
    const subcommand = interaction.options.data[0].name;

    await subcmds[subcommand](interaction);
  },
};

const subcmds: {[key: string]: (job: CommandInteraction) => Promise<void>} = {
  // hashmap of subcommands
  // TODO:
  sub1,
  sub2,
};

async function sub1(interaction: CommandInteraction) {
  // TODO: implement subcommand
  const embed = new EmbedBuilder()
    .setTitle('EMBED_TITLE')
    .setDescription('EMBED_DESC')
    .setFooter({text: FOOTER_MESSAGE})
    .setTimestamp();

  // we use editReply because slashcommands are deferred by default
  // discord requires a response within 3 seconds, so we defer a response and then edit it later
  await interaction.editReply({embeds: [embed]});
}

async function sub2(interaction: CommandInteraction) {
  // TODO: implement subcommand
  const embed = new EmbedBuilder()
    .setTitle('EMBED_TITLE')
    .setDescription('EMBED_DESC')
    .setFooter({text: FOOTER_MESSAGE})
    .setTimestamp();

  // we use editReply because slashcommands are deferred by default
  // discord requires a response within 3 seconds, so we defer a response and then edit it later
  await interaction.editReply({embeds: [embed]});
}

export default command;
