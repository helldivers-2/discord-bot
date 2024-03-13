import {data} from './api';

export function getAllCampaigns() {
  return data.Campaigns;
}

export function getPopularCampaign() {
  // get campaign with the most players
  const popularCampaign = data.Campaigns.reduce((a, b) =>
    a.planetData.players > b.planetData.players ? a : b
  );
  return popularCampaign;
}

export function getCampaignByPlanetName(planetName: string) {
  const campaign = data.Campaigns.find(
    c => c.planetName.toLowerCase() === planetName.toLowerCase()
  );
  return campaign;
}
