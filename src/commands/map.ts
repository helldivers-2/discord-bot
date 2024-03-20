import {
  AttachmentBuilder,
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import {Command} from '../interfaces';
import {FOOTER_MESSAGE} from './_components';
import {data} from '../api-wrapper';
import {createCanvas, loadImage} from 'canvas';
import {create2kCanvas, FONT} from '../handlers';

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

    await subcmds[subcommand](interaction);
  },
};

const subcmds: {[key: string]: (job: CommandInteraction) => Promise<void>} = {
  // hashmap of subcommands
  galaxy,
  planet,
};

async function galaxy(interaction: CommandInteraction) {
  const planets = data.Planets;

  const canvas = create2kCanvas();
  const context = canvas.getContext('2d');

  // Start a new path for filling in only circle background
  context.beginPath();
  // Draw a circle in the middle of the canvas
  context.arc(
    canvas.width / 2,
    canvas.height / 2,
    Math.min(canvas.width, canvas.height) / 2,
    0,
    2 * Math.PI
  );
  context.clip(); // Clip rendering to the current circle path
  context.fillStyle = 'black';
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Load the sectormap image
  const image = await loadImage('./images/hd2_sectormap_2k.png');

  context.globalAlpha = 0.21; // make the sectormap 50% transparent

  // Draw the image onto the canvas
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  context.globalAlpha = 1.0;

  // Find the minimum and maximum x and y values
  const minX = Math.min(...planets.map(planet => planet.position.x));
  const maxX = Math.max(...planets.map(planet => planet.position.x));
  const minY = Math.min(...planets.map(planet => planet.position.y));
  const maxY = Math.max(...planets.map(planet => planet.position.y));

  // Calculate the scale factors
  const padding = 50; // Padding in pixels
  const scaleX = (canvas.width - 2 * padding) / (maxX - minX);
  const scaleY = (canvas.height - 2 * padding) / (maxY - minY);

  // Draw a point for each planet at its x, y coordinates
  for (const planet of planets) {
    context.globalAlpha = 1;
    // Translate and scale the coordinates
    const x = padding + (planet.position.x - minX) * scaleX;
    // const y = canvas.height - padding - (planet.position.y - minY) * scaleY; // Invert the y-coordinate
    const y = canvas.height - (padding + (planet.position.y - minY) * scaleY);

    // Set the fill style for the points
    const colour =
      planet.owner === 'Humans'
        ? '#46BDF0'
        : planet.owner === 'Terminids'
        ? '#FEB801'
        : '#FE6D6A';
    context.fillStyle = colour;
    context.fillRect(x, y - 8, 8, 8);

    // Set the fill style for the text
    context.fillStyle = 'white';
    context.font = `25px ${FONT}`;

    // Calculate the width of the text
    const textWidth = context.measureText(planet.name).width;

    // don't render the text if the planet is controlled by us and has no campaign
    const campaign = data.Campaigns.find(c => c.planetIndex === planet.index);
    if (planet.owner === 'Humans' && !campaign) continue;

    // Draw the planet name next to the point
    // If the planet is too close to the right edge, draw the text to the left of the point
    if (x + textWidth + 10 > canvas.width)
      context.fillText(planet.name, x - textWidth - 10, y + 3);
    else context.fillText(planet.name, x + 10, y + 3);
  }

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

  const canvas = create2kCanvas();
  const context = canvas.getContext('2d');
  // Start a new path for filling in only circle background
  context.beginPath();
  // Draw a circle in the middle of the canvas
  context.arc(
    canvas.width / 2,
    canvas.height / 2,
    Math.min(canvas.width, canvas.height) / 2,
    0,
    2 * Math.PI
  );
  context.clip(); // Clip rendering to the current circle path
  context.fillStyle = 'black';
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Load the sectormap image
  const image = await loadImage('./images/hd2_sectormap_2k.png');

  context.globalAlpha = 0.21; // make the sectormap 50% transparent

  // Draw the image onto the canvas
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  context.globalAlpha = 1.0;

  // Find the minimum and maximum x and y values
  const minX = Math.min(...planets.map(planet => planet.position.x));
  const maxX = Math.max(...planets.map(planet => planet.position.x));
  const minY = Math.min(...planets.map(planet => planet.position.y));
  const maxY = Math.max(...planets.map(planet => planet.position.y));

  // Calculate the scale factors
  const padding = 50; // Padding in pixels
  const scaleX = (canvas.width - 2 * padding) / (maxX - minX);
  const scaleY = (canvas.height - 2 * padding) / (maxY - minY);

  // Draw a point for each planet at its x, y coordinates
  for (const planet of planets) {
    context.globalAlpha = 1;
    // Translate and scale the coordinates
    const x = padding + (planet.position.x - minX) * scaleX;
    // const y = canvas.height - padding - (planet.position.y - minY) * scaleY; // Invert the y-coordinate
    const y = canvas.height - (padding + (planet.position.y - minY) * scaleY);

    // Set the fill style for the points
    const colour =
      planet.owner === 'Humans'
        ? '#46BDF0'
        : planet.owner === 'Terminids'
        ? '#FEB801'
        : '#FE6D6A';
    context.fillStyle = colour;
    context.fillRect(x, y - 8, 8, 8);

    // Set the fill style for the text
    context.fillStyle = 'white';

    // Calculate the width of the text
    const textWidth = context.measureText(planet.name).width;

    if (planet.owner === 'Humans') context.globalAlpha = 0.5;

    const campaign = data.Campaigns.find(c => c.planetIndex === planet.index);
    let planetText: string = planet.name;
    if (campaign) {
      context.font = `18px ${FONT}`;

      planetText += '\n';
      planetText += `Helldivers: ${campaign.planetData.players.toLocaleString()} (${
        campaign.planetData.playerPerc
      }%)`;
      planetText += '\n';
      planetText +=
        campaign.campaignType === 'Liberation'
          ? `Liberation: ${campaign.planetData.liberation.toFixed(2)}%`
          : `Defence: ${campaign.planetEvent?.defence.toFixed(2)}%`;
    } else if (planet.name === userQuery) {
      context.font = `18px ${FONT}`;
      context.globalAlpha = 1;
    } else {
      context.font = `15px ${FONT}`;
      context.globalAlpha = 0.5;
    }

    // Draw the planet name next to the point
    // If the planet is too close to the right edge, draw the text to the left of the point
    if (x + textWidth + 10 > canvas.width)
      context.fillText(planetText, x - textWidth - 10, y + 3);
    else context.fillText(planetText, x + 10, y + 3);
  }

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
