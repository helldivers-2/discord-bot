import {data} from './api';
import {GlobalEvent} from './types';

export function getAllEvents(): GlobalEvent[] {
  return data.Events;
}

export function getLatestEvent(): GlobalEvent {
  return data.Events.sort((a, b) => b.eventId - a.eventId)[0];
}
