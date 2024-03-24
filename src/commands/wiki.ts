import {
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';
import {Command} from '../interfaces';
import {FOOTER_MESSAGE} from './_components';
import {wikiCmd} from '.';

const RESPONSE_TIME = 15_000; // 15 seconds

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('wiki')
    .setDescription('Get information about various Helldivers 2 systems'),
  run: async interaction => {
    const embed = new EmbedBuilder()
      .setTitle('HellCom: Helldivers 2 Wiki')
      .setDescription(
        'This "wiki" is heavily WIP. As the game changes, this information will be updated as quickly as possible! ' +
          'It is maintained by the community and is not affiliated in any way with Arrowhead Game Studios. ' +
          'If you would like to contribute, please see the [wiki contrib documentation](https://github.com/jgaribsin/hellcom?tab=readme-ov-file#wiki-source).' +
          '\n\n' +
          'Pages are organised under major categories. Select one below to view the available pages:'
      )
      .setFields(
        {
          name: 'Categories',
          value: wikiCmd.buttons.length.toLocaleString(),
          inline: true,
        },
        {
          name: 'Pages',
          value: wikiCmd.pages.length.toLocaleString(),
          inline: true,
        }
      )
      .setFooter({text: FOOTER_MESSAGE})
      .setTimestamp();

    // create a new row for every 5 buttons
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    for (let i = 0; i < wikiCmd.buttons.length; i += 5) {
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        wikiCmd.buttons.slice(i, i + 5)
      );
      rows.push(row);
    }
    // const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    //   wikiCmd.buttons
    // );

    const reply = await interaction.editReply({
      embeds: [embed],
      components: rows,
    });
    const filter = (i: any) => i.user.id === interaction.user.id;

    try {
      const categorySelect = await reply.awaitMessageComponent({
        filter,
        time: RESPONSE_TIME,
      });
      const category = wikiCmd.categories.find(
        c => c.directory === categorySelect.customId
      );

      const categoryEmbed = new EmbedBuilder().setTitle(
        categorySelect.customId
      );
      if (category && category.display_name)
        categoryEmbed.setTitle(category.display_name);
      if (category && category.content)
        categoryEmbed.setDescription(category.content);
      if (category && category.fields) categoryEmbed.setFields(category.fields);
      if (category && category.thumbnail)
        categoryEmbed.setThumbnail(category.thumbnail);
      if (category && category.image) categoryEmbed.setImage(category.image);

      const categoryResponse = await categorySelect.update({
        embeds: [categoryEmbed],
        components: [
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            wikiCmd.dirSelect[categorySelect.customId]
          ),
        ],
      });

      const pageSelect = await categoryResponse.awaitMessageComponent({
        filter,
        time: RESPONSE_TIME,
      });
      if (!pageSelect.isStringSelectMenu()) return;

      const page = wikiCmd.pages.find(
        page => page.page === pageSelect.values[0]
      );

      if (!page) {
        await pageSelect.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(`Page Not Found!`)
              .setDescription(
                `The selected page was not found!` +
                  '\n\n' +
                  `${pageSelect.customId}`
              ),
          ],
          components: [],
        });
        return;
      }
      const embed = new EmbedBuilder()
        .setTitle(page.title)
        .setFooter({text: FOOTER_MESSAGE})
        .setTimestamp();

      if (page.content) embed.setDescription(page.content);
      else
        embed.setDescription(
          'Wiki page is work in progress!' +
            '\n\n' +
            'If you would like to contribute, please see the [wiki contrib documentation](https://github.com/jgaribsin/hellcom?tab=readme-ov-file#wiki-source)!'
        );
      if (page.fields) embed.setFields(page.fields);
      if (page.thumbnail) embed.setThumbnail(page.thumbnail);
      if (page.image) embed.setImage(page.image);

      await interaction.editReply({
        embeds: [embed],
        components: [],
      });
    } catch (e) {
      if ((e as any).code === 'InteractionCollectorError')
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle(`No response received!`)
              .setFooter({text: FOOTER_MESSAGE})
              .setTimestamp(),
          ],
          components: [],
        });
      else console.error(e);
    }
  },
};
// https://xywpvislkizlfztycqhf.supabase.co/storage/v1/object/public/hellcom/embeds/eagle_fly_in.GIF?t=2024-03-22T20%3A25%3A21.941Z
// https://ezgif.com/gif-to-webp?url=https://xywpvislkizlfztycqhf.supabase.co/storage/v1/object/public/hellcom/embeds/eagle_fly_in.GIF?t=2024-03-22T20%3A25%3A21.941Z
export default command;
