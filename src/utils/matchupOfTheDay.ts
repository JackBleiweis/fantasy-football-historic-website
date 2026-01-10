/**
 * Matchup of the Day utility
 * 
 * Uses the current date as a seed to select a consistent random matchup
 * for the entire day.
 */

import type { LeagueId, Matchup, Team } from '../types';
import { getAvailableYears, getSeasonData } from '../data';

export interface MatchupOfTheDay {
  matchup: Matchup;
  year: number;
  team1: Team | undefined;
  team2: Team | undefined;
}

/**
 * Simple hash function for a date string
 */
function hashDate(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get the matchup of the day for a league
 * Returns the same matchup for the entire day based on the current date
 */
export function getMatchupOfTheDay(leagueId: LeagueId): MatchupOfTheDay | null {
  const years = getAvailableYears(leagueId);
  if (years.length === 0) return null;

  // Collect all completed matchups from all years
  const allMatchups: { matchup: Matchup; year: number; teams: Team[] }[] = [];
  
  for (const year of years) {
    const seasonData = getSeasonData(leagueId, year);
    if (!seasonData) continue;
    
    for (const matchup of seasonData.matchups) {
      // Only include completed, non-consolation matchups
      if (matchup.isComplete && !matchup.isConsolation) {
        allMatchups.push({
          matchup,
          year,
          teams: seasonData.teams,
        });
      }
    }
  }

  if (allMatchups.length === 0) return null;

  // Use today's date + leagueId as seed for consistency
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}-${leagueId}`;
  const hash = hashDate(dateStr);
  const index = hash % allMatchups.length;

  const selected = allMatchups[index];
  const team1 = selected.teams.find((t) => t.id === selected.matchup.team1Id);
  const team2 = selected.teams.find((t) => t.id === selected.matchup.team2Id);

  return {
    matchup: selected.matchup,
    year: selected.year,
    team1,
    team2,
  };
}
