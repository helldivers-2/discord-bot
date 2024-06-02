export function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export function planetNameTransform(planetName: string) {
  return planetName
    .toLowerCase() // Convert to lowercase
    .replace(/'/g, '') // Remove apostrophes
    .replace(/\s/g, '_'); // Replace spaces with underscores
}

const biomeMap: Record<string, string> = {
  Crimsonmoor: 'Crimson',
  Toxic: 'Acidic',
  Desolate: 'Inferno',
  Tundra: 'Taiga',
};
export function planetBiomeTransform(biome: string) {
  return (biomeMap[biome] || biome).toLowerCase();
}

export function formatPlayers(players: number) {
  if (players >= 1000000) {
    return (players / 1000000).toFixed(2) + 'm';
  } else if (players >= 2000) {
    return (players / 1000).toFixed(1) + 'k';
  } else {
    return players.toLocaleString();
  }
}
