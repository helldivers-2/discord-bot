import {data, seasons} from './api';

export function getAllCampaigns(war_id?: number) {
  const warId = war_id || seasons.current;
  return data[warId].Campaigns;
}

export function getPopularCampaign() {
  // get campaign with the most players
  const warId = seasons.current;
  const popularCampaign = data[warId].Campaigns.reduce((a, b) =>
    a.planetData.players > b.planetData.players ? a : b
  );
  return popularCampaign;
}

export function getCampaignByPlanetName(planetName: string, war_id?: number) {
  const warId = war_id || seasons.current;
  const campaign = data[warId].Campaigns.find(
    c => c.planetName.toLowerCase() === planetName.toLowerCase()
  );
  return campaign;
}
