import {createCanvas, loadImage, registerFont} from 'canvas';
import {data, Faction} from '../api-wrapper';

registerFont('./fonts/Monda-Regular.ttf', {
  family: 'Monda',
});

export const create2kCanvas = () => {
  const canvas = createCanvas(2000, 2000);
  const context = canvas.getContext('2d');
  context.font = '20px Monda';
  return canvas;
};

export const FONT = 'Monda';

const colours: Record<Faction, string[]> = {
  Humans: ['#1d8dc1', '#2f34f9'],
  Terminids: ['#fe8001', '#FEB801'],
  Automaton: ['#ca1212', '#fb4a47'],
  Illuminate: ['#8A1EFF', '#B856E2'],
  Total: ['#FFFFFF', '#6bf046'],
};

export async function generateGalacticMap() {
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

  context.globalAlpha = 0.21;

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

  // Draw supply lines first so planets/text are on top
  for (const planet of planets) {
    const {waypoints} = planet;

    const x = padding + (planet.position.x - minX) * scaleX;
    const y = canvas.height - (padding + (planet.position.y - minY) * scaleY);

    const waypointPlanets = waypoints.map(waypoint =>
      planets.find(p => p.index === waypoint)
    );
    const scaledWaypointCoords = waypointPlanets.map(waypoint => {
      if (!waypoint) return {x: 0, y: 0, name: '', i: -1};
      const x = padding + (waypoint.position.x - minX) * scaleX;
      const y =
        canvas.height - (padding + (waypoint.position.y - minY) * scaleY);
      return {x, y, name: waypoint.name, i: waypoint.index};
    });

    context.globalAlpha = 0.5;
    for (const waypoint of scaledWaypointCoords) {
      context.beginPath(); // Start a new path
      context.strokeStyle = colours['Total'][0];
      context.lineWidth = 3;
      context.moveTo(x, y);
      context.lineTo(waypoint.x, waypoint.y);
      context.stroke(); // Stroke the current path
    }
  }

  // Draw a circle for each planet at its x, y coordinates
  for (const planet of planets) {
    context.globalAlpha = 1;
    // Translate and scale the coordinates
    const x = padding + (planet.position.x - minX) * scaleX;
    const y = canvas.height - (padding + (planet.position.y - minY) * scaleY);

    // Find the campaign for the current planet
    const campaign = data.Campaigns.find(c => c.planetIndex === planet.index);

    const planetRadius = 10;
    const campaignRadius = 20;
    if (campaign) {
      if (campaign.campaignType === 'Liberation') {
        const progress = campaign.planetData.liberation / 100;
        const progressAngle = progress * 2 * Math.PI;

        // for campaign planets, draw a circle around the point
        context.fillStyle = colours['Total'][0];
        context.beginPath();
        context.arc(x, y, campaignRadius + 2, 0, 2 * Math.PI);
        context.fill();

        // draw the planet itself using a different colour
        // draw our progress as a portion of the circle
        context.fillStyle = colours['Humans'][1];
        context.beginPath();
        context.moveTo(x, y); // This line is added to create a pie chart effect
        context.arc(
          x,
          y,
          campaignRadius,
          -0.5 * Math.PI,
          -0.5 * Math.PI + progressAngle
        );
        context.closePath(); // This line is added to create a pie chart effect
        context.fill();

        // fill the rest with the enemy colour
        context.fillStyle = colours[planet.owner][1];
        context.beginPath();
        context.moveTo(x, y); // This line is added to create a pie chart effect
        context.arc(
          x,
          y,
          campaignRadius,
          -0.5 * Math.PI + progressAngle,
          1.5 * Math.PI
        );
        context.closePath(); // This line is added to create a pie chart effect
        context.fill();
      } else {
        const progress = (campaign.planetEvent?.defence ?? 0) / 100;
        const progressAngle = (1 - progress) * 2 * Math.PI;
        const race = campaign.planetEvent?.race ?? 'Humans';
        // for campaign planets, draw a circle around the point
        context.fillStyle = colours['Total'][1];
        context.beginPath();
        context.arc(x, y, campaignRadius + 2, 0, 2 * Math.PI);
        context.fill();

        // draw the planet itself using a different colour
        // draw our progress as a portion of the circle
        context.fillStyle = colours[race][1];
        context.beginPath();
        context.moveTo(x, y); // This line is added to create a pie chart effect
        context.arc(
          x,
          y,
          campaignRadius,
          -0.5 * Math.PI,
          -0.5 * Math.PI + progressAngle
        );
        context.closePath(); // This line is added to create a pie chart effect
        context.fill();

        // fill the rest with the enemy colour
        context.fillStyle = colours['Humans'][1];
        context.beginPath();
        context.moveTo(x, y); // This line is added to create a pie chart effect
        context.arc(
          x,
          y,
          campaignRadius,
          -0.5 * Math.PI + progressAngle,
          1.5 * Math.PI
        );
        context.closePath(); // This line is added to create a pie chart effect
        context.fill();
      }
    } else {
      // if there's no campaign, just draw the planet circle
      context.fillStyle = colours[planet.owner][0];
      context.beginPath();
      context.arc(x, y, planetRadius, 0, 2 * Math.PI);
      context.fill();
    }

    // Set the fill style for the text
    context.fillStyle = 'white';
    context.font = `30px ${FONT}`;

    // don't render the text if the planet is controlled by us and has no campaign
    if (planet.owner === 'Humans' && !campaign) continue;

    // Draw the planet name next to the point
    // If the planet is too close to the right edge, draw the text to the left of the point
    if (campaign) {
      // Split the planet name into words
      const words = planet.name.split(' ').reverse();

      // Calculate the height of the text
      const lineHeight = parseInt(context.font, 10);

      // Draw each word on a new line
      for (let i = 0; i < words.length; i++) {
        // Calculate the width of the current word
        const wordWidth = context.measureText(words[i]).width;

        // Calculate the x-coordinate for center alignment
        const centeredX = x - wordWidth / 2;

        // Adjust the y-coordinate to position the text above the planet
        const belowPlanetY = y + 10 + (words.length - i) * lineHeight;

        context.fillText(words[i], centeredX, belowPlanetY);
      }
    }
  }

  return {
    canvas,
    padding,
    minX,
    maxX,
    minY,
    maxY,
    scaleX,
    scaleY,
  };
}
