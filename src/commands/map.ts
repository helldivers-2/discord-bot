import {
  AttachmentBuilder,
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import {Command} from '../interfaces';
import {FOOTER_MESSAGE} from './_components';
import {data} from '../api-wrapper';
import {createCanvas} from 'canvas';
import {generateGalacticMap} from '../handlers';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('map')
    .setDescription('Map Planets on the galactic map')
    .addSubcommand(subcommand =>
      subcommand
        .setName('planet')
        .setDescription('Show a specific planet on the galactic map')
        .addStringOption(option =>
          option
            .setName('planet_name')
            .setDescription('Planet name')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('galaxy')
        .setDescription('Show an overview of the galactic map')
    ),
  run: async interaction => {
    const subcommand = interaction.options.data[0].name;
    // temp embed to show while we're loading the server info
    await interaction.editReply({
      embeds: [new EmbedBuilder().setTitle('Generating galactic map...')],
    });

    await subcmds[subcommand](interaction);
  },
};

const subcmds: {[key: string]: (job: CommandInteraction) => Promise<void>} = {
  // hashmap of subcommands
  galaxy,
  planet,
};

async function galaxy(interaction: CommandInteraction) {
  const {canvas} = await generateGalacticMap();

  // Convert the canvas to an image buffer
  const buffer = canvas.toBuffer('image/png');

  // Create an attachment from the buffer
  const attachment = new AttachmentBuilder(buffer, {name: 'map.png'});

  const embeds: EmbedBuilder[] = [
    new EmbedBuilder()
      .setTitle('Helldivers 2: Galactic Map')
      .setImage('attachment://map.png')
      .setFooter({text: FOOTER_MESSAGE}),
  ];

  await interaction.editReply({embeds, files: [attachment]});
}

async function planet(interaction: CommandInteraction) {
  const userQuery = interaction.options.get('planet_name', true)
    .value as string;

  const planets = data.Planets;

  const {canvas, padding, minX, minY, scaleX, scaleY} =
    await generateGalacticMap();

  // Define the crop size
  const cropSize = 800;

  // Find the planet to center the crop around
  const targetPlanet = planets.find(planet => planet.name === userQuery);
  if (!targetPlanet) throw new Error('Target planet not found');

  // Calculate the crop coordinates based on the planet's position
  const cropX =
    padding + (targetPlanet.position.x - minX) * scaleX - cropSize / 2;
  const cropY =
    canvas.height -
    (padding + (targetPlanet.position.y - minY) * scaleY) -
    cropSize / 2;

  // Create a new canvas for the cropped image
  const cropCanvas = createCanvas(cropSize, cropSize);
  const cropContext = cropCanvas.getContext('2d');
  cropContext.fillStyle = 'black';
  cropContext.fillRect(0, 0, cropCanvas.width, cropCanvas.height);

  // Draw the cropped portion of the original canvas onto the new canvas
  cropContext.drawImage(
    canvas,
    cropX,
    cropY,
    cropSize,
    cropSize,
    0,
    0,
    cropSize,
    cropSize
  );

  // Convert the cropped canvas to an image buffer
  const buffer = cropCanvas.toBuffer('image/png');

  // Create an attachment from the buffer
  const attachment = new AttachmentBuilder(buffer, {name: 'map.png'});

  const embeds: EmbedBuilder[] = [
    new EmbedBuilder()
      .setTitle(`Galactic Map: ${userQuery}`)
      .setImage('attachment://map.png')
      .setFooter({text: FOOTER_MESSAGE}),
  ];

  await interaction.editReply({embeds, files: [attachment]});
}

export default command;
