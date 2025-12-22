/**
 * Utility functions to transform Yahoo Fantasy Football exports
 * from column-oriented format to row-oriented format.
 */

import type {
  Team,
  DraftPick,
  Matchup,
  SeasonData,
  LeagueId,
  RawYahooTeam,
  RawYahooDraft,
  RawYahooMatchup,
} from '../types';

/**
 * Simplify Yahoo Team ID by extracting just the team number
 * e.g., "461.l.785363.t.6" -> "t.6"
 */
function simplifyTeamId(fullId: string): string {
  const match = fullId.match(/t\.\d+$/);
  return match ? match[0] : fullId;
}

/**
 * Transform raw Yahoo Team data to our Team format
 */
export function transformTeams(raw: RawYahooTeam): Team[] {
  const count = raw.ID.length;
  const teams: Team[] = [];

  for (let i = 0; i < count; i++) {
    teams.push({
      id: simplifyTeamId(raw.ID[i]),
      name: raw.Name[i],
      manager: raw.Manager[i],
      wins: raw.Wins[i],
      losses: raw.Losses[i],
      ties: raw.Ties[i],
      rank: raw.Rank[i],
      playoffSeed: raw['Playoff Seed'][i],
      isCommissioner: raw.Commissioner[i],
      imageUrl: raw.Image[i],
    });
  }

  return teams;
}

/**
 * Transform raw Yahoo Draft data to our DraftPick format
 */
export function transformDraft(raw: RawYahooDraft): DraftPick[] {
  const count = raw.Pick.length;
  const picks: DraftPick[] = [];

  for (let i = 0; i < count; i++) {
    picks.push({
      pick: raw.Pick[i],
      round: raw.Round[i],
      teamId: simplifyTeamId(raw['Team ID'][i]),
      teamName: raw['Team Name'][i],
      playerId: raw['Player ID'][i],
      playerFirstName: raw['First Name'][i],
      playerLastName: raw['Last Name'][i],
      avgPick: raw['Avg. Pick'][i],
      avgRound: raw['Avg. Round'][i],
    });
  }

  return picks;
}

/**
 * Transform raw Yahoo Matchup data to our Matchup format
 */
export function transformMatchups(raw: RawYahooMatchup): Matchup[] {
  const count = raw.Week.length;
  const matchups: Matchup[] = [];

  for (let i = 0; i < count; i++) {
    matchups.push({
      week: raw.Week[i],
      team1Id: simplifyTeamId(raw['Team 1 ID'][i]),
      team1Name: raw['Team 1 Name'][i],
      team1Points: raw['Team 1 Points'][i],
      team2Id: simplifyTeamId(raw['Team 2 ID'][i]),
      team2Name: raw['Team 2 Name'][i],
      team2Points: raw['Team 2 Points'][i],
      isComplete: raw.Complete[i],
      isPlayoff: raw.Playoff[i],
      isConsolation: raw.Consolation[i],
    });
  }

  return matchups;
}

/**
 * Transform all raw Yahoo data files into a complete SeasonData object
 */
export function transformSeasonData(
  year: number,
  leagueId: LeagueId,
  rawTeam: RawYahooTeam,
  rawDraft: RawYahooDraft,
  rawMatchup: RawYahooMatchup
): SeasonData {
  return {
    year,
    leagueId,
    teams: transformTeams(rawTeam),
    draft: transformDraft(rawDraft),
    matchups: transformMatchups(rawMatchup),
  };
}

/**
 * Get the winner of a matchup
 * Returns the team ID of the winner, or null for ties/incomplete
 */
export function getMatchupWinner(matchup: Matchup): string | null {
  if (!matchup.isComplete) return null;
  if (matchup.team1Points === matchup.team2Points) return null;
  return matchup.team1Points > matchup.team2Points
    ? matchup.team1Id
    : matchup.team2Id;
}

/**
 * Calculate a team's record from matchups
 */
export function calculateTeamRecord(
  teamId: string,
  matchups: Matchup[],
  options: { includePlayoffs?: boolean; includeConsolation?: boolean } = {}
): { wins: number; losses: number; ties: number } {
  const { includePlayoffs = false, includeConsolation = false } = options;

  let wins = 0;
  let losses = 0;
  let ties = 0;

  for (const matchup of matchups) {
    // Skip incomplete matchups
    if (!matchup.isComplete) continue;

    // Filter by matchup type
    if (matchup.isPlayoff && !includePlayoffs) continue;
    if (matchup.isConsolation && !includeConsolation) continue;

    // Check if this team played in this matchup
    const isTeam1 = matchup.team1Id === teamId;
    const isTeam2 = matchup.team2Id === teamId;
    if (!isTeam1 && !isTeam2) continue;

    const teamPoints = isTeam1 ? matchup.team1Points : matchup.team2Points;
    const oppPoints = isTeam1 ? matchup.team2Points : matchup.team1Points;

    if (teamPoints > oppPoints) {
      wins++;
    } else if (teamPoints < oppPoints) {
      losses++;
    } else {
      ties++;
    }
  }

  return { wins, losses, ties };
}

/**
 * Calculate total points for a team across all matchups
 */
export function calculateTotalPoints(
  teamId: string,
  matchups: Matchup[],
  options: { onlyComplete?: boolean } = {}
): number {
  const { onlyComplete = true } = options;

  let total = 0;

  for (const matchup of matchups) {
    if (onlyComplete && !matchup.isComplete) continue;

    if (matchup.team1Id === teamId) {
      total += matchup.team1Points;
    } else if (matchup.team2Id === teamId) {
      total += matchup.team2Points;
    }
  }

  return total;
}
