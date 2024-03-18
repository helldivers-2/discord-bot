import {data} from './api';
import {NewsFeedItem} from './types';

export function getAllDispatches(): NewsFeedItem[] {
  return data.NewsFeed;
}
