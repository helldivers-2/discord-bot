import {EmbedBuilder, SlashCommandBuilder} from 'discord.js';
import {Command} from '../interfaces';
import {FOOTER_MESSAGE} from './_components';
import {
  ArmorItem,
  BoosterItem,
  data,
  GrenadeItem,
  WeaponItem,
} from '../api-wrapper';
import {supportDiscordRow} from '../handlers';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('items')
    .setDescription('Look up any in-game Helldivers 2 item')
    .addSubcommand(subcommand =>
      subcommand
        .setName('armor')
        .setDescription('Look up any in-game Helldivers 2 armor')
        .addStringOption(option =>
          option
            .setName('item')
            .setDescription('Name of the armor')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('weapon')
        .setDescription('Look up any in-game Helldivers 2 weapon')
        .addStringOption(option =>
          option
            .setName('item')
            .setDescription('Name of the weapon')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('grenade')
        .setDescription('Look up any in-game Helldivers 2 grenade')
        .addStringOption(option =>
          option
            .setName('item')
            .setDescription('Name of the grenade')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('booster')
        .setDescription('Look up any in-game Helldivers 2 booster')
        .addStringOption(option =>
          option
            .setName('item')
            .setDescription('Name of the booster')
            .setRequired(true)
            .setAutocomplete(true)
        )
    ),

  run: async interaction => {
    const item = interaction.options.get('item', true).value as string;
    const subCmd = interaction.options.data[0].name;

    const {Items} = data;
    if (!Items) {
      await interaction.editReply({
        content: 'Items data is not available',
      });
      return;
    }

    let foundItems: ArmorItem[] | WeaponItem[] | GrenadeItem[] | BoosterItem[] =
      [];
    if (subCmd === 'armor') {
      const armors = [
        ...Items.armor.Cloak,
        ...Items.armor.Head,
        ...Items.armor.Body,
      ];
      const foundArmors = armors.filter(
        a => `${a.name} (${a.type} ${a.slot})` === item
      );
      // deduplicate armours
      foundItems = foundArmors.filter((armor, index) => {
        return (
          index ===
          foundArmors.findIndex(obj => {
            return JSON.stringify(obj) === JSON.stringify(armor);
          })
        );
      });
    } else if (subCmd === 'weapon') {
      const weapons = [
        ...Items.weapons.primaries,
        ...Items.weapons.secondaries,
      ];
      foundItems = weapons.filter(weapon => weapon.name === item);
    } else if (subCmd === 'grenade') {
      const grenades = Items.weapons.grenades;
      foundItems = grenades.filter(grenade => grenade.name === item);
    } else if (subCmd === 'booster') {
      const boosters = Items.boosters;
      foundItems = boosters.filter(booster => booster.name === item);
    }

    if (!foundItems) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Item Not Found')
            .setDescription(
              `The item you searched for ("${item}") could not be found. Please verify your spelling and try again.` +
                '\n\nIf there is a missing item, please report it in the Discord below.'
            )
            .setFooter({
              text: FOOTER_MESSAGE,
            }),
        ],
        components: [supportDiscordRow],
      });
      return;
    }
    const embeds: EmbedBuilder[] = [];
    for (const foundItem of foundItems) {
      const embed = new EmbedBuilder()
        .setTitle(foundItem.name)
        .setDescription(foundItem.description)
        .setFooter({
          text: FOOTER_MESSAGE,
        });
      if ('armor_rating' in foundItem) {
        embed.setTitle(
          `${foundItem.name} (${foundItem.type} ${foundItem.slot})`
        );
        embed.addFields(
          {
            name: 'Armor Rating',
            value: `${foundItem.armor_rating}`,
            inline: true,
          },
          {
            name: 'Speed',
            value: `${foundItem.speed}`,
            inline: true,
          },
          {
            name: 'Stamina Regen',
            value: `${foundItem.stamina_regen}`,
            inline: true,
          },
          {
            name: `Passive: **${foundItem.passive.name}**`,
            value: foundItem.passive.description,
            inline: false,
          }
        );
      } else if ('fire_rate' in foundItem) {
        embed.addFields(
          {
            name: 'Damage',
            value: `${foundItem.damage}`,
            inline: true,
          },
          {
            name: 'Capacity',
            value: `${foundItem.capacity}`,
            inline: true,
          },
          {
            name: 'Recoil',
            value: `${foundItem.recoil}`,
            inline: true,
          },
          {
            name: 'Fire Rate',
            value: `${foundItem.fire_rate}`,
            inline: true,
          },
          {
            name: 'Fire Mode',
            value: foundItem.fire_mode.join('\n'),
            inline: false,
          },
          {
            name: 'Traits',
            value: foundItem.traits.join('\n'),
            inline: false,
          }
        );
      } else if ('fuse_time' in foundItem) {
        embed.addFields(
          {
            name: 'Damage',
            value: `${foundItem.damage}`,
            inline: true,
          },
          {
            name: 'Penetration',
            value: `${foundItem.penetration}`,
            inline: true,
          },
          {
            name: 'Outer Radius',
            value: `${foundItem.outer_radius}`,
            inline: true,
          },
          {
            name: 'Fuse Time',
            value: `${foundItem.fuse_time}`,
            inline: true,
          }
        );
      }

      // Skip displaying items that are identical
      if (!embeds.find(e => e.data.title === embed.data.title))
        embeds.push(embed);
    }

    await interaction.editReply({
      embeds: embeds,
    });
  },
};

export default command;
