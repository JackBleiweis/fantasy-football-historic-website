import type { LeagueId, Trade } from '../types';
import { getAvailableYears, getSeasonData } from '../data';
import { pickDailyIndex } from './dailySeed';

export function getTradeOfTheDay(leagueId: LeagueId): Trade | null {
  const trades: Trade[] = [];

  for (const year of getAvailableYears(leagueId)) {
    const season = getSeasonData(leagueId, year);
    if (!season?.trades) continue;
    trades.push(...season.trades.filter((t) => t.sides.length >= 2));
  }

  if (trades.length === 0) return null;
  return trades[pickDailyIndex(trades.length, `${leagueId}-trade`)];
}
