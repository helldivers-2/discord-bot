import {
  ChannelType,
  ColorResolvable,
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import {Command} from '../interfaces';
import {EMBED_COLOUR, FOOTER_MESSAGE} from './_components';
import {client, missingChannelPerms, sleep, warStatusEmbeds} from '../handlers';
import {isProd} from '../config';
import {db, newAnnouncementChannel, newPersistentMessage} from '../db';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('subscribe')
    .setDescription('Subscribe to notifications for a specific event.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Display current galactic war status.')
    )
    // .addSubcommand(subcommand =>
    //   subcommand
    //     .setName('planets')
    //     .setDescription(
    //       'Sends a message planet becomes available or unavailable.'
    //     )
    // )
    .addSubcommand(subcommand =>
      subcommand
        .setName('events')
        .setDescription('Sends a message when a global event starts or ends.')
    ),
  run: async interaction => {
    const subcommand = interaction.options.data[0].name;
    // TODO: limit each type of subscription to one per guild
    if (interaction.guild) {
      const user = await interaction.guild.members.fetch(interaction.user.id);
      if (!user.permissions.has('ManageMessages')) {
        // respond with missing perms, then delete the response after 5s
        await interaction.editReply(missingChannelPerms(interaction));
        await sleep(5000);
        await interaction.deleteReply();
        return;
      }
    }

    await subcmds[subcommand](interaction);
  },
};

const subcmds: {[key: string]: (job: CommandInteraction) => Promise<void>} = {
  // hashmap of subcommands
  // TODO:
  status,
  planet,
  events,
};

async function status(interaction: CommandInteraction) {
  const message = await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setAuthor({
          name: interaction.user.tag,
          iconURL: interaction.user.avatarURL() || undefined,
        })
        .setTitle('Testing Permissions...')
        .setDescription(
          'Checking if this can be updated in the future...\n\n' +
            'If this message does not change, then the bot is missing the following permissions:\n' +
            '- View Channel\n' +
            '- Embed Links'
        )
        .setFooter({text: FOOTER_MESSAGE})
        .setColor(EMBED_COLOUR)
        .setTimestamp(),
    ],
  });

  // try to update interaction reply via message API to check permissions
  try {
    const messageChannel = await client.channels.fetch(message.channelId);
    if (
      messageChannel &&
      (messageChannel.type === ChannelType.GuildText ||
        messageChannel.type === ChannelType.PublicThread)
    ) {
      const discordMsg = await messageChannel.messages.fetch(message.id);
      if (discordMsg)
        await discordMsg.edit({
          embeds: warStatusEmbeds(),
        });
    }

    // if edit succeeds, then create db entry to update the message in future
    await newPersistentMessage({
      messageId: message.id,
      channelId: message.channelId,
      type: 'war_status',
      userId: interaction.user.id,
      guildId: message.guild?.id || '',
      production: isProd,
    });

    // API throws noaccess err if bot doesn't have perms for the channel
    // update interaction reply to reflect that, then remove it 10s later
  } catch (err) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: interaction.user.tag,
            iconURL: interaction.user.avatarURL() || undefined,
          })
          .setTitle('Missing Permissions')
          .setDescription(
            'Bot requires `View Channel` and `Embed Link` permissions for this command!'
          )
          .setFooter({text: FOOTER_MESSAGE})
          .setColor(EMBED_COLOUR as ColorResolvable)
          .setTimestamp(),
      ],
    });
    await sleep(10000);
    await interaction.deleteReply();
  }
}

async function events(interaction: CommandInteraction) {
  const embed = new EmbedBuilder()
    .setTitle('Channel Subscribed!')
    .setDescription(
      'You will now recieve notifications for subsequent Helldivers 2 global events!'
    )
    .setFooter({text: FOOTER_MESSAGE})
    .setTimestamp();

  await newAnnouncementChannel({
    channelId: interaction.channelId,
    type: 'events',
    userId: interaction.user.id,
    guildId: interaction.guildId || '',
    production: isProd,
  });

  // we use editReply because slashcommands are deferred by default
  // discord requires a response within 3 seconds, so we defer a response and then edit it later
  await interaction.editReply({embeds: [embed]});
}

async function planet(interaction: CommandInteraction) {
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
