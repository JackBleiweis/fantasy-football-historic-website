import type { LeagueId, SeasonData, Trade } from '../types';
import { getAvailableYears, getSeasonData, getPlayoffHistory } from '../data';
import { createTeamLookup } from './teamUtils';

export interface ManagerSeasonMark {
  manager: string;
  teamName: string;
  year: number;
  value: number;
}

export interface ManagerCareerMark {
  manager: string;
  value: number;
  seasons?: number;
}

export interface MatchupMark {
  year: number;
  week: number;
  value: number;
  manager1: string;
  team1: string;
  points1: number;
  manager2: string;
  team2: string;
  points2: number;
}

export interface TeamNameMark {
  manager: string;
  teamName: string;
  year: number;
  note?: string;
}

export interface LeagueRecords {
  highScore: MatchupMark | null;
  lowScore: MatchupMark | null;
  biggestBlowout: MatchupMark | null;
  closestGame: MatchupMark | null;
  highestCombined: MatchupMark | null;
  mostWinsSeason: ManagerSeasonMark | null;
  fewestWinsSeason: ManagerSeasonMark | null;
  highestSeasonPF: ManagerSeasonMark | null;
  lowestSeasonPF: ManagerSeasonMark | null;
  mostMovesSeason: ManagerSeasonMark | null;
  mostTradesSeason: ManagerSeasonMark | null;
  mostMovesCareer: ManagerCareerMark | null;
  mostTradesCareer: ManagerCareerMark | null;
  longestWinStreak: ManagerSeasonMark | null;
  mostChampionships: ManagerCareerMark | null;
  mostFinals: ManagerCareerMark | null;
  mostPlayoffAppearances: ManagerCareerMark | null;
  bestTeamName: TeamNameMark | null;
  seasonsTracked: number;
  yearRange: string;
}

const CURATED_BEST_NAMES: Partial<
  Record<LeagueId, { year: number; teamName: string; note: string }>
> = {
  cwp: {
    year: 2024,
    teamName: 'Not Etienne Brooke\u2019s Stinkybox',
    note: 'League-certified masterpiece.',
  },
};

function normalizeTeamName(name: string) {
  return name.replace(/['\u2018\u2019]/g, "'").toLowerCase();
}

 * Prefer single-week scores. Multi-week championship finals (Yahoo combined
 * totals) are rewritten in transform; skip any leftover flagged rows.
 */
function regularMatchups(season: SeasonData) {
  return season.matchups.filter(
    (m) =>
      m.isComplete &&
      !m.isPlayoff &&
      !m.isConsolation &&
      !m.isMultiWeekFinal
  );
}

function seasonPointsFor(season: SeasonData): Map<string, number> {
  const map = new Map<string, number>();
  for (const m of regularMatchups(season)) {
    map.set(m.team1Id, (map.get(m.team1Id) || 0) + m.team1Points);
    map.set(m.team2Id, (map.get(m.team2Id) || 0) + m.team2Points);
  }
  return map;
}

function countManagerTrades(season: SeasonData, manager: string): number {
  const lower = manager.toLowerCase();
  const fromCount = season.teams.find((t) => t.manager.toLowerCase() === lower)
    ?.tradesCount;
  if (fromCount != null && fromCount > 0) return fromCount;

  let count = 0;
  for (const trade of season.trades || []) {
    if (trade.sides.some((s) => s.manager.toLowerCase() === lower)) count += 1;
  }
  return count;
}

function longestWinStreakInSeason(
  season: SeasonData
): { manager: string; teamName: string; streak: number } | null {
  const lookup = createTeamLookup(season.teams);
  const streaks = new Map<string, { current: number; best: number }>();

  const byWeek = new Map<number, typeof season.matchups>();
  for (const m of regularMatchups(season)) {
    const list = byWeek.get(m.week) || [];
    list.push(m);
    byWeek.set(m.week, list);
  }

  for (const week of [...byWeek.keys()].sort((a, b) => a - b)) {
    for (const m of byWeek.get(week) || []) {
      const apply = (teamId: string, won: boolean) => {
        const entry = streaks.get(teamId) || { current: 0, best: 0 };
        entry.current = won ? entry.current + 1 : 0;
        entry.best = Math.max(entry.best, entry.current);
        streaks.set(teamId, entry);
      };
      if (m.team1Points === m.team2Points) {
        apply(m.team1Id, false);
        apply(m.team2Id, false);
      } else {
        apply(m.team1Id, m.team1Points > m.team2Points);
        apply(m.team2Id, m.team2Points > m.team1Points);
      }
    }
  }

  let best: { manager: string; teamName: string; streak: number } | null = null;
  for (const [teamId, { best: streak }] of streaks) {
    if (!best || streak > best.streak) {
      const team = lookup.get(teamId);
      best = {
        manager: team?.manager || '',
        teamName: team?.name || '',
        streak,
      };
    }
  }
  return best && best.streak > 0 ? best : null;
}

function pickBestTeamName(
  leagueId: LeagueId,
  seasons: SeasonData[]
): TeamNameMark | null {
  const curated = CURATED_BEST_NAMES[leagueId];
  if (curated) {
    for (const season of seasons) {
      if (season.year !== curated.year) continue;
      const team = season.teams.find(
        (t) => normalizeTeamName(t.name) === normalizeTeamName(curated.teamName)
      );
      if (team) {
        return {
          manager: team.manager,
          teamName: team.name,
          year: season.year,
          note: curated.note,
        };
      }
    }
  }

  // Fallback: longest team name with some character
  let best: TeamNameMark | null = null;
  for (const season of seasons) {
    for (const team of season.teams) {
      if (!best || team.name.length > best.teamName.length) {
        best = {
          manager: team.manager,
          teamName: team.name,
          year: season.year,
          note: 'Longest team name on record.',
        };
      }
    }
  }
  return best;
}

export function getTradesForManagerSeason(
  leagueId: LeagueId,
  year: number,
  manager: string
): Trade[] {
  const season = getSeasonData(leagueId, year);
  if (!season?.trades) return [];
  const lower = manager.toLowerCase();
  return season.trades.filter((trade) =>
    trade.sides.some((s) => s.manager.toLowerCase() === lower)
  );
}

export function computeLeagueRecords(leagueId: LeagueId): LeagueRecords {
  const years = getAvailableYears(leagueId);
  const seasons = years
    .map((year) => getSeasonData(leagueId, year))
    .filter((s): s is SeasonData => !!s);

  const empty: LeagueRecords = {
    highScore: null,
    lowScore: null,
    biggestBlowout: null,
    closestGame: null,
    highestCombined: null,
    mostWinsSeason: null,
    fewestWinsSeason: null,
    highestSeasonPF: null,
    lowestSeasonPF: null,
    mostMovesSeason: null,
    mostTradesSeason: null,
    mostMovesCareer: null,
    mostTradesCareer: null,
    longestWinStreak: null,
    mostChampionships: null,
    mostFinals: null,
    mostPlayoffAppearances: null,
    bestTeamName: null,
    seasonsTracked: years.length,
    yearRange:
      years.length > 0
        ? `${years[years.length - 1]} – ${years[0]}`
        : '',
  };

  if (seasons.length === 0) return empty;

  let highScore: MatchupMark | null = null;
  let lowScore: MatchupMark | null = null;
  let biggestBlowout: MatchupMark | null = null;
  let closestGame: MatchupMark | null = null;
  let highestCombined: MatchupMark | null = null;
  let mostWinsSeason: ManagerSeasonMark | null = null;
  let fewestWinsSeason: ManagerSeasonMark | null = null;
  let highestSeasonPF: ManagerSeasonMark | null = null;
  let lowestSeasonPF: ManagerSeasonMark | null = null;
  let mostMovesSeason: ManagerSeasonMark | null = null;
  let mostTradesSeason: ManagerSeasonMark | null = null;
  let longestWinStreak: ManagerSeasonMark | null = null;

  const careerMoves = new Map<string, { value: number; seasons: number }>();
  const careerTrades = new Map<string, { value: number; seasons: number }>();

  for (const season of seasons) {
    const lookup = createTeamLookup(season.teams);
    const pfMap = seasonPointsFor(season);

    for (const m of regularMatchups(season)) {
      const t1 = lookup.get(m.team1Id);
      const t2 = lookup.get(m.team2Id);
      const mark = (
        manager: string,
        team: string,
        points: number,
        otherManager: string,
        otherTeam: string,
        otherPoints: number
      ): MatchupMark => ({
        year: season.year,
        week: m.week,
        value: points,
        manager1: manager,
        team1: team,
        points1: points,
        manager2: otherManager,
        team2: otherTeam,
        points2: otherPoints,
      });

      if (!highScore || m.team1Points > highScore.value) {
        highScore = mark(
          t1?.manager || '',
          m.team1Name,
          m.team1Points,
          t2?.manager || '',
          m.team2Name,
          m.team2Points
        );
      }
      if (!highScore || m.team2Points > highScore.value) {
        highScore = mark(
          t2?.manager || '',
          m.team2Name,
          m.team2Points,
          t1?.manager || '',
          m.team1Name,
          m.team1Points
        );
      }
      if (m.team1Points > 0 && (!lowScore || m.team1Points < lowScore.value)) {
        lowScore = mark(
          t1?.manager || '',
          m.team1Name,
          m.team1Points,
          t2?.manager || '',
          m.team2Name,
          m.team2Points
        );
      }
      if (m.team2Points > 0 && (!lowScore || m.team2Points < lowScore.value)) {
        lowScore = mark(
          t2?.manager || '',
          m.team2Name,
          m.team2Points,
          t1?.manager || '',
          m.team1Name,
          m.team1Points
        );
      }

      const margin = Math.abs(m.team1Points - m.team2Points);
      const combined = m.team1Points + m.team2Points;
      const winnerIs1 = m.team1Points >= m.team2Points;
      const blowoutMark: MatchupMark = {
        year: season.year,
        week: m.week,
        value: margin,
        manager1: winnerIs1 ? t1?.manager || '' : t2?.manager || '',
        team1: winnerIs1 ? m.team1Name : m.team2Name,
        points1: winnerIs1 ? m.team1Points : m.team2Points,
        manager2: winnerIs1 ? t2?.manager || '' : t1?.manager || '',
        team2: winnerIs1 ? m.team2Name : m.team1Name,
        points2: winnerIs1 ? m.team2Points : m.team1Points,
      };
      if (!biggestBlowout || margin > biggestBlowout.value) {
        biggestBlowout = blowoutMark;
      }
      if (margin > 0 && (!closestGame || margin < closestGame.value)) {
        closestGame = blowoutMark;
      }
      if (!highestCombined || combined > highestCombined.value) {
        highestCombined = {
          ...blowoutMark,
          value: combined,
          manager1: t1?.manager || '',
          team1: m.team1Name,
          points1: m.team1Points,
          manager2: t2?.manager || '',
          team2: m.team2Name,
          points2: m.team2Points,
        };
      }
    }

    // Include playoff games for blowout/closest/combined too? User said all-time records - blowout already included all complete in old code. Keep regular for scoring purity; blowout can include all complete non-consolation.
    for (const m of season.matchups.filter(
      (x) => x.isComplete && !x.isConsolation
    )) {
      const t1 = lookup.get(m.team1Id);
      const t2 = lookup.get(m.team2Id);
      const margin = Math.abs(m.team1Points - m.team2Points);
      const winnerIs1 = m.team1Points >= m.team2Points;
      const blowoutMark: MatchupMark = {
        year: season.year,
        week: m.week,
        value: margin,
        manager1: winnerIs1 ? t1?.manager || '' : t2?.manager || '',
        team1: winnerIs1 ? m.team1Name : m.team2Name,
        points1: winnerIs1 ? m.team1Points : m.team2Points,
        manager2: winnerIs1 ? t2?.manager || '' : t1?.manager || '',
        team2: winnerIs1 ? m.team2Name : m.team1Name,
        points2: winnerIs1 ? m.team2Points : m.team1Points,
      };
      if (!biggestBlowout || margin > biggestBlowout.value) {
        biggestBlowout = blowoutMark;
      }
    }

    for (const team of season.teams) {
      if (!mostWinsSeason || team.wins > mostWinsSeason.value) {
        mostWinsSeason = {
          manager: team.manager,
          teamName: team.name,
          year: season.year,
          value: team.wins,
        };
      }
      const games = team.wins + team.losses + team.ties;
      if (games > 0) {
        if (!fewestWinsSeason || team.wins < fewestWinsSeason.value) {
          fewestWinsSeason = {
            manager: team.manager,
            teamName: team.name,
            year: season.year,
            value: team.wins,
          };
        }
      }

      const pf = pfMap.get(team.id) || 0;
      if (pf > 0) {
        if (!highestSeasonPF || pf > highestSeasonPF.value) {
          highestSeasonPF = {
            manager: team.manager,
            teamName: team.name,
            year: season.year,
            value: pf,
          };
        }
        if (!lowestSeasonPF || pf < lowestSeasonPF.value) {
          lowestSeasonPF = {
            manager: team.manager,
            teamName: team.name,
            year: season.year,
            value: pf,
          };
        }
      }

      const moves = team.moves ?? 0;
      if (moves > 0) {
        if (!mostMovesSeason || moves > mostMovesSeason.value) {
          mostMovesSeason = {
            manager: team.manager,
            teamName: team.name,
            year: season.year,
            value: moves,
          };
        }
        const career = careerMoves.get(team.manager) || {
          value: 0,
          seasons: 0,
        };
        career.value += moves;
        career.seasons += 1;
        careerMoves.set(team.manager, career);
      }

      const trades = countManagerTrades(season, team.manager);
      if (trades > 0) {
        if (!mostTradesSeason || trades > mostTradesSeason.value) {
          mostTradesSeason = {
            manager: team.manager,
            teamName: team.name,
            year: season.year,
            value: trades,
          };
        }
        const career = careerTrades.get(team.manager) || {
          value: 0,
          seasons: 0,
        };
        career.value += trades;
        career.seasons += 1;
        careerTrades.set(team.manager, career);
      }
    }

    const streak = longestWinStreakInSeason(season);
    if (
      streak &&
      (!longestWinStreak || streak.streak > longestWinStreak.value)
    ) {
      longestWinStreak = {
        manager: streak.manager,
        teamName: streak.teamName,
        year: season.year,
        value: streak.streak,
      };
    }
  }

  const topCareer = (map: Map<string, { value: number; seasons: number }>) => {
    let best: ManagerCareerMark | null = null;
    for (const [manager, data] of map) {
      if (!best || data.value > best.value) {
        best = { manager, value: data.value, seasons: data.seasons };
      }
    }
    return best;
  };

  const playoffs = getPlayoffHistory(leagueId);
  const titles = new Map<string, number>();
  const finals = new Map<string, number>();
  const appearances = new Map<string, number>();
  if (playoffs) {
    for (const year of playoffs.history) {
      titles.set(year.champion, (titles.get(year.champion) || 0) + 1);
      finals.set(year.champion, (finals.get(year.champion) || 0) + 1);
      finals.set(year.runnerUp, (finals.get(year.runnerUp) || 0) + 1);
      const field = new Set([
        year.champion,
        year.runnerUp,
        ...year.playoffTeams,
      ]);
      for (const name of field) {
        appearances.set(name, (appearances.get(name) || 0) + 1);
      }
    }
  }

  const topNamed = (map: Map<string, number>) => {
    let best: ManagerCareerMark | null = null;
    for (const [manager, value] of map) {
      if (!best || value > best.value) best = { manager, value };
    }
    return best;
  };

  return {
    highScore,
    lowScore,
    biggestBlowout,
    closestGame,
    highestCombined,
    mostWinsSeason,
    fewestWinsSeason,
    highestSeasonPF,
    lowestSeasonPF,
    mostMovesSeason,
    mostTradesSeason,
    mostMovesCareer: topCareer(careerMoves),
    mostTradesCareer: topCareer(careerTrades),
    longestWinStreak,
    mostChampionships: topNamed(titles),
    mostFinals: topNamed(finals),
    mostPlayoffAppearances: topNamed(appearances),
    bestTeamName: pickBestTeamName(leagueId, seasons),
    seasonsTracked: years.length,
    yearRange:
      years.length > 0 ? `${years[years.length - 1]} – ${years[0]}` : '',
  };
}
