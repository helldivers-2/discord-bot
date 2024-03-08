import {data, seasons} from './api';
import {GlobalEvent} from './types';

export function getAllEvents(war_id?: number): GlobalEvent[] {
  const warId = war_id || seasons.current;
  return data[warId].Events;
}

export function getLatestEvent(war_id?: number): GlobalEvent {
  const warId = war_id || seasons.current;
  return data[warId].Events.sort((a, b) => b.eventId - a.eventId)[0];
}
