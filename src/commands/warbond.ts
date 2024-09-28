// import {SlashCommandBuilder} from 'discord.js';
// import {Command} from '../interfaces';
// import {ApiData} from '../api-wrapper';
// import {warbondPageResponse} from '../handlers';
//
// const command: Command = {
//   data: new SlashCommandBuilder()
//     .setName('warbonds')
//     .setDescription('View available warbonds and their rewards!')
//     .addStringOption(option =>
//       option
//         .setName('warbond')
//         .setDescription('The specific warbond to view')
//         .setRequired(true)
//         .addChoices(
//           {
//             name: 'Helldivers Mobilize',
//             value: 'helldivers_mobilize',
//           },
//           {
//             name: 'Steeled Veterans',
//             value: 'steeled_veterans',
//           },
//           {
//             name: 'Cutting Edge',
//             value: 'cutting_edge',
//           },
//           {
//             name: 'Democratic Detonation',
//             value: 'democratic_detonation',
//           },
//           {
//             name: 'Polar Patriots',
//             value: 'polar_patriots',
//           }
//         )
//     ),
//   run: async interaction => {
//     const warbond = interaction.options.get('warbond', true)
//       .value as keyof ApiData['Warbonds'];
//
//     const {embeds, components} = warbondPageResponse({
//       interaction: 'command',
//       warbond: warbond,
//       warbondPage: '1',
//       action: 'none',
//     });
//     await interaction.editReply({
//       embeds: embeds,
//       components: components ?? [],
//     });
//   },
// };
//
// export default command;
