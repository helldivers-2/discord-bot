import {EmbedBuilder, SlashCommandBuilder} from 'discord.js';
import {Command} from '../interfaces';
import {FOOTER_MESSAGE} from './_components';
import {data} from '../api-wrapper';
import {dayjs} from '../handlers/dates';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('superstore')
    .setDescription('Check the current stock of the super store!'),
  run: async interaction => {
    const {SuperStore} = data;
    if (!SuperStore || !SuperStore.items) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Super Store')
            .setDescription(
              'Failed to retrieve Super Store data. Please try again later!'
            )
            .setFooter({text: FOOTER_MESSAGE}),
        ],
      });
      return;
    }
    const embeds: EmbedBuilder[] = [];
    for (const item of SuperStore.items) {
      const embed = new EmbedBuilder()
        .setTitle(`${item.name} (${item.type} ${item.slot})`)
        .setDescription(item.description)
        .addFields(
          {
            name: 'Armour',
            value: `${item.armor_rating}`,
            inline: true,
          },
          {
            name: 'Speed',
            value: `${item.speed}`,
            inline: true,
          },
          {
            name: 'Stamina Regen',
            value: `${item.stamina_regen}`,
            inline: true,
          },
          {
            name: `Passive: ${item.passive.name}`,
            value: item.passive.description,
            inline: false,
          }
        );
      embeds.push(embed);
    }

    // add a final embed for the expiration time
    const expireTimeS = dayjs(SuperStore.expire_time).unix();
    const expiresIn = dayjs(SuperStore.expire_time).diff();
    const expiresInH = Math.floor(expiresIn / 3600000);
    const remainingMinutes = Math.floor((expiresIn % 3600000) / 60000);

    embeds.push(
      new EmbedBuilder()
        .setTitle('Super Store')
        .setDescription(
          `This store rotation will expire in **${expiresInH} hours, ${remainingMinutes} minutes** (<t:${expireTimeS}:f>)` +
            '\n\n Data provided by **[Diveharder](https://api.diveharder.com/docs)**.'
        )
        .setFooter({text: FOOTER_MESSAGE})
    );
    await interaction.editReply({embeds: embeds});
  },
};

export default command;
