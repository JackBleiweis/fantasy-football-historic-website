import {
  getAvailableYears,
  getSeasonData,
  getPlayoffHistory,
  getManagerPlayoffStats,
} from '../data';
import { getManagerAvatar, getManagerId } from '../data/managers';
import type { LeagueId } from '../types';

export interface ManagerSummary {
  name: string;
  id: string;
  championships: number;
  wins: number;
  losses: number;
  ties: number;
  seasons: number;
  avgPF: number;
  avatar?: string;
}

interface Accumulator extends ManagerSummary {
  totalPF: number;
  gamesPlayed: number;
}

function getOrCreate(
  map: Map<string, Accumulator>,
  name: string,
  leagueId: LeagueId
): Accumulator {
  const key = name.toLowerCase();
  const existing = map.get(key);
  if (existing) return existing;

  const entry: Accumulator = {
    name,
    id: getManagerId(name, leagueId),
    championships: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    seasons: 0,
    avgPF: 0,
    avatar: getManagerAvatar(name),
    totalPF: 0,
    gamesPlayed: 0,
  };
  map.set(key, entry);
  return entry;
}

export function getLeagueManagerSummaries(
  leagueId: LeagueId
): ManagerSummary[] {
  const managerStats = new Map<string, Accumulator>();
  const years = getAvailableYears(leagueId);

  for (const year of years) {
    const seasonData = getSeasonData(leagueId, year);
    if (!seasonData) continue;

    const teamPoints = new Map<string, { pf: number; games: number }>();
    for (const matchup of seasonData.matchups) {
      if (!matchup.isComplete) continue;

      const t1 = teamPoints.get(matchup.team1Id) || { pf: 0, games: 0 };
      t1.pf += matchup.team1Points;
      t1.games++;
      teamPoints.set(matchup.team1Id, t1);

      const t2 = teamPoints.get(matchup.team2Id) || { pf: 0, games: 0 };
      t2.pf += matchup.team2Points;
      t2.games++;
      teamPoints.set(matchup.team2Id, t2);
    }

    for (const team of seasonData.teams) {
      const existing = getOrCreate(managerStats, team.manager, leagueId);
      existing.wins += team.wins;
      existing.losses += team.losses;
      existing.ties += team.ties;
      existing.seasons += 1;

      const points = teamPoints.get(team.id);
      if (points) {
        existing.totalPF += points.pf;
        existing.gamesPlayed += points.games;
      }
    }
  }

  const playoffHistory = getPlayoffHistory(leagueId);
  if (playoffHistory) {
    for (const year of playoffHistory.history) {
      const names = [
        year.champion,
        year.runnerUp,
        ...year.playoffTeams,
      ];
      for (const name of names) {
        if (name) getOrCreate(managerStats, name, leagueId);
      }
    }
  }

  const allManagers = Array.from(managerStats.values()).map((stats) => {
    const playoffStats = getManagerPlayoffStats(leagueId, stats.name);
    stats.championships = playoffStats.championships;
    stats.avgPF =
      stats.gamesPlayed > 0 ? stats.totalPF / stats.gamesPlayed : 0;
    return {
      name: stats.name,
      id: stats.id,
      championships: stats.championships,
      wins: stats.wins,
      losses: stats.losses,
      ties: stats.ties,
      seasons: stats.seasons,
      avgPF: stats.avgPF,
      avatar: stats.avatar,
    };
  });

  allManagers.sort((a, b) => {
    if (b.championships !== a.championships) {
      return b.championships - a.championships;
    }
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.name.localeCompare(b.name);
  });

  return allManagers;
}
