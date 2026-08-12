/**
 * Data loader utilities for fantasy football data
 */

import type {
  SeasonData,
  LeagueInfo,
  LeagueId,
  PlayoffHistory,
  PlayoffYear,
} from '../types';

// Import CWP data
import cwp2014 from './cwp/2014.json';
import cwp2015 from './cwp/2015.json';
import cwp2016 from './cwp/2016.json';
import cwp2017 from './cwp/2017.json';
import cwp2018 from './cwp/2018.json';
import cwp2019 from './cwp/2019.json';
import cwp2020 from './cwp/2020.json';
import cwp2021 from './cwp/2021.json';
import cwp2022 from './cwp/2022.json';
import cwp2023 from './cwp/2023.json';
import cwp2024 from './cwp/2024.json';
import cwp2025 from './cwp/2025.json';
import cwpPlayoffs from './cwp/playoffs.json';

// Import LP data
import lp2017 from './lp/2017.json';
import lp2018 from './lp/2018.json';
import lp2019 from './lp/2019.json';
import lp2020 from './lp/2020.json';
import lp2021 from './lp/2021.json';
import lp2022 from './lp/2022.json';
import lp2023 from './lp/2023.json';
import lp2024 from './lp/2024.json';
import lp2025 from './lp/2025.json';
import lpPlayoffs from './lp/playoffs.json';

/**
 * League metadata
 */
export const leagues: Record<LeagueId, LeagueInfo> = {
  cwp: {
    id: 'cwp',
    name: 'CWP Fantasy League',
    shortName: 'CWP',
    description: 'The CWP Fantasy Football League',
    years: [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012],
  },
  lp: {
    id: 'lp',
    name: 'Dirty Dozen',
    shortName: 'DD',
    description: 'The Dirty Dozen Fantasy Football League',
    years: [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017],
  },
};

/**
 * All season data organized by league and year
 */
const seasonDataMap: Record<LeagueId, Record<number, SeasonData>> = {
  cwp: {
    2014: cwp2014 as SeasonData,
    2015: cwp2015 as SeasonData,
    2016: cwp2016 as SeasonData,
    2017: cwp2017 as SeasonData,
    2018: cwp2018 as SeasonData,
    2019: cwp2019 as SeasonData,
    2020: cwp2020 as SeasonData,
    2021: cwp2021 as SeasonData,
    2022: cwp2022 as SeasonData,
    2023: cwp2023 as SeasonData,
    2024: cwp2024 as SeasonData,
    2025: cwp2025 as SeasonData,
  },
  lp: {
    2017: lp2017 as SeasonData,
    2018: lp2018 as SeasonData,
    2019: lp2019 as SeasonData,
    2020: lp2020 as SeasonData,
    2021: lp2021 as SeasonData,
    2022: lp2022 as SeasonData,
    2023: lp2023 as SeasonData,
    2024: lp2024 as SeasonData,
    2025: lp2025 as SeasonData,
  },
};

/**
 * Playoff history by league
 */
const playoffHistoryMap: Record<LeagueId, PlayoffHistory | null> = {
  cwp: cwpPlayoffs as PlayoffHistory,
  lp: lpPlayoffs as PlayoffHistory,
};

/**
 * Get season data for a specific league and year
 */
export function getSeasonData(
  leagueId: LeagueId,
  year: number
): SeasonData | null {
  return seasonDataMap[leagueId]?.[year] ?? null;
}

/**
 * Get years that have full season data (drafts, matchups, standings)
 */
export function getAvailableYears(leagueId: LeagueId): number[] {
  return Object.keys(seasonDataMap[leagueId] || {})
    .map(Number)
    .sort((a, b) => b - a); // Most recent first
}

/**
 * Years to show in year pickers: season data plus playoff-only years
 */
export function getDisplayYears(leagueId: LeagueId): number[] {
  const seasonYears = getAvailableYears(leagueId);
  const playoffYears =
    playoffHistoryMap[leagueId]?.history.map((h) => h.year) ?? [];
  return Array.from(new Set([...seasonYears, ...playoffYears])).sort(
    (a, b) => b - a
  );
}

export function isPlayoffOnlyYear(leagueId: LeagueId, year: number): boolean {
  return !getSeasonData(leagueId, year) && !!getPlayoffYear(leagueId, year);
}

export function getLatestChampion(leagueId: LeagueId): {
  year: number;
  name: string;
} | null {
  const history = playoffHistoryMap[leagueId]?.history ?? [];
  if (history.length === 0) return null;
  const latest = [...history].sort((a, b) => b.year - a.year)[0];
  return { year: latest.year, name: latest.champion };
}

/**
 * Get the most recent season data for a league
 */
export function getLatestSeasonData(leagueId: LeagueId): SeasonData | null {
  const years = getAvailableYears(leagueId);
  if (years.length === 0) return null;
  return getSeasonData(leagueId, years[0]);
}

/**
 * Get league info by ID
 */
export function getLeagueInfo(leagueId: LeagueId): LeagueInfo | null {
  return leagues[leagueId] ?? null;
}

/**
 * Check if a league ID is valid
 */
export function isValidLeague(id: string): id is LeagueId {
  return id === 'lp' || id === 'cwp';
}

/**
 * Get complete playoff history for a league
 */
export function getPlayoffHistory(leagueId: LeagueId): PlayoffHistory | null {
  return playoffHistoryMap[leagueId] ?? null;
}

/**
 * Get playoff data for a specific year
 */
export function getPlayoffYear(
  leagueId: LeagueId,
  year: number
): PlayoffYear | null {
  const history = playoffHistoryMap[leagueId];
  if (!history) return null;
  return history.history.find((h) => h.year === year) ?? null;
}

/**
 * Get manager's playoff stats from historical data
 */
export function getManagerPlayoffStats(
  leagueId: LeagueId,
  managerName: string
): {
  championships: number;
  finalsAppearances: number;
  playoffAppearances: number;
  championshipYears: number[];
  finalsYears: number[];
  playoffYears: number[];
} {
  const history = playoffHistoryMap[leagueId];
  const lowerName = managerName.toLowerCase();

  const result = {
    championships: 0,
    finalsAppearances: 0,
    playoffAppearances: 0,
    championshipYears: [] as number[],
    finalsYears: [] as number[],
    playoffYears: [] as number[],
  };

  if (!history) return result;

  for (const year of history.history) {
    const isChampion = year.champion.toLowerCase() === lowerName;
    const isRunnerUp = year.runnerUp.toLowerCase() === lowerName;
    const isPlayoffTeam = year.playoffTeams.some(
      (t) => t.toLowerCase() === lowerName
    );

    if (isChampion) {
      result.championships++;
      result.finalsAppearances++;
      result.playoffAppearances++;
      result.championshipYears.push(year.year);
      result.finalsYears.push(year.year);
      result.playoffYears.push(year.year);
    } else if (isRunnerUp) {
      result.finalsAppearances++;
      result.playoffAppearances++;
      result.finalsYears.push(year.year);
      result.playoffYears.push(year.year);
    } else if (isPlayoffTeam) {
      result.playoffAppearances++;
      result.playoffYears.push(year.year);
    }
  }

  return result;
}
