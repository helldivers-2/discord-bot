import {data, seasons} from './api';

export function getAllCampaigns(war_id?: number) {
  const warId = war_id || seasons.current;
  return data[warId].Campaigns;
}

export function getCampaignByPlanetName(planetName: string, war_id?: number) {
  const warId = war_id || seasons.current;
  const campaign = data[warId].Campaigns.find(
    c => c.planetName.toLowerCase() === planetName.toLowerCase()
  );
  return campaign;
}
