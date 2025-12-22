import { useMemo } from 'react';
import {
  getAvailableYears,
  getSeasonData,
  getManagerPlayoffStats,
  getPlayoffYear,
} from '../data';
import { createTeamLookup } from '../utils/teamUtils';
import type { LeagueId } from '../types';

export interface SeasonRecord {
  year: number;
  teamName: string;
  wins: number;
  losses: number;
  ties: number;
  rank: number;
  playoffSeed: number;
  pointsFor: number;
  pointsAgainst: number;
  isChampion: boolean;
  isRunnerUp: boolean;
  madePlayoffs: boolean;
}

export interface ManagerStats {
  name: string;
  leagueId: LeagueId;
  // All-time record (from season data only)
  totalWins: number;
  totalLosses: number;
  totalTies: number;
  winPercentage: number;
  // Career stats (from season data only)
  totalPointsScored: number;
  averagePointsPerWeek: number;
  highestSingleGameScore: number;
  highestGameDetails: {
    week: number;
    year: number;
    points: number;
    opponent: string;
  } | null;
  // Playoff stats (from playoff history - includes all years)
  championshipsWon: number;
  finalsAppearances: number;
  playoffAppearances: number;
  championshipYears: number[];
  // Season breakdown (from season data only)
  seasons: SeasonRecord[];
}

/**
 * Hook to calculate all stats for a manager across all seasons
 */
export function useManagerStats(
  managerName: string,
  leagueId: LeagueId
): ManagerStats | null {
  return useMemo(() => {
    if (!managerName || !leagueId) return null;

    // Get playoff stats from historical data (includes years without full season data)
    const playoffStats = getManagerPlayoffStats(leagueId, managerName);

    const years = getAvailableYears(leagueId);
    const seasons: SeasonRecord[] = [];
    let totalWins = 0;
    let totalLosses = 0;
    let totalTies = 0;
    let totalPointsScored = 0;
    let totalGamesPlayed = 0;
    let highestSingleGameScore = 0;
    let highestGameDetails: ManagerStats['highestGameDetails'] = null;

    for (const year of years) {
      const seasonData = getSeasonData(leagueId, year);
      if (!seasonData) continue;

      // Find the manager's team for this season
      const team = seasonData.teams.find(
        (t) => t.manager.toLowerCase() === managerName.toLowerCase()
      );
      if (!team) continue;

      const teamLookup = createTeamLookup(seasonData.teams);

      // Get playoff info for this year from historical data
      const playoffYear = getPlayoffYear(leagueId, year);
      const lowerName = managerName.toLowerCase();
      const isChampion =
        playoffYear?.champion.toLowerCase() === lowerName || false;
      const isRunnerUp =
        playoffYear?.runnerUp.toLowerCase() === lowerName || false;
      const madePlayoffs =
        isChampion ||
        isRunnerUp ||
        (playoffYear?.playoffTeams.some(
          (t) => t.toLowerCase() === lowerName
        ) ??
          false);

      // Calculate points for/against from matchups
      let pointsFor = 0;
      let pointsAgainst = 0;
      let gamesPlayed = 0;

      seasonData.matchups
        .filter((m) => m.isComplete)
        .forEach((matchup) => {
          if (matchup.team1Id === team.id) {
            pointsFor += matchup.team1Points;
            pointsAgainst += matchup.team2Points;
            gamesPlayed++;

            // Check for highest score
            if (matchup.team1Points > highestSingleGameScore) {
              highestSingleGameScore = matchup.team1Points;
              const opponent = teamLookup.get(matchup.team2Id);
              highestGameDetails = {
                week: matchup.week,
                year,
                points: matchup.team1Points,
                opponent: opponent?.manager || matchup.team2Name,
              };
            }
          } else if (matchup.team2Id === team.id) {
            pointsFor += matchup.team2Points;
            pointsAgainst += matchup.team1Points;
            gamesPlayed++;

            // Check for highest score
            if (matchup.team2Points > highestSingleGameScore) {
              highestSingleGameScore = matchup.team2Points;
              const opponent = teamLookup.get(matchup.team1Id);
              highestGameDetails = {
                week: matchup.week,
                year,
                points: matchup.team2Points,
                opponent: opponent?.manager || matchup.team1Name,
              };
            }
          }
        });

      // Add to totals
      totalWins += team.wins;
      totalLosses += team.losses;
      totalTies += team.ties;
      totalPointsScored += pointsFor;
      totalGamesPlayed += gamesPlayed;

      seasons.push({
        year,
        teamName: team.name,
        wins: team.wins,
        losses: team.losses,
        ties: team.ties,
        rank: team.rank,
        playoffSeed: team.playoffSeed,
        pointsFor,
        pointsAgainst,
        isChampion,
        isRunnerUp,
        madePlayoffs,
      });
    }

    // Sort seasons by year descending
    seasons.sort((a, b) => b.year - a.year);

    const totalGames = totalWins + totalLosses + totalTies;
    const winPercentage = totalGames > 0 ? totalWins / totalGames : 0;
    const averagePointsPerWeek =
      totalGamesPlayed > 0 ? totalPointsScored / totalGamesPlayed : 0;

    return {
      name: managerName,
      leagueId,
      totalWins,
      totalLosses,
      totalTies,
      winPercentage,
      totalPointsScored,
      averagePointsPerWeek,
      highestSingleGameScore,
      highestGameDetails,
      // Use playoff stats from historical data
      championshipsWon: playoffStats.championships,
      finalsAppearances: playoffStats.finalsAppearances,
      playoffAppearances: playoffStats.playoffAppearances,
      championshipYears: playoffStats.championshipYears,
      seasons,
    };
  }, [managerName, leagueId]);
}
