// =============================================================================
// Fantasy Football Data Types
// =============================================================================

/**
 * League identifier type
 */
export type LeagueId = 'lp' | 'cwp';

/**
 * Team information for a specific season
 */
export interface Team {
  id: string;
  name: string;
  manager: string; // The actual person (owner)
  wins: number;
  losses: number;
  ties: number;
  rank: number;
  playoffSeed: number;
  isCommissioner: boolean;
  imageUrl: string;
  moves?: number;
  tradesCount?: number;
}

/**
 * Individual draft pick
 */
export interface DraftPick {
  pick: number; // Overall pick number (1-150+)
  round: number;
  teamId: string;
  teamName: string;
  playerId: string;
  playerFirstName: string;
  playerLastName: string;
  avgPick: number | null;
  avgRound: number | null;
}

/**
 * Weekly matchup between two teams
 */
export interface Matchup {
  week: number;
  team1Id: string;
  team1Name: string;
  team1Points: number;
  team2Id: string;
  team2Name: string;
  team2Points: number;
  isComplete: boolean;
  isPlayoff: boolean;
  isConsolation: boolean;
  /**
   * Championship final that Yahoo stored as a multi-week combined total.
   * Points on this row are the single-week (usually week-17) score after transform.
   * See scripts/LEAGUE_QUIRKS.md.
   */
  isMultiWeekFinal?: boolean;
}

/**
 * Complete season data for a league
 */
export interface TradeSide {
  teamId: string;
  teamName: string;
  manager: string;
  sent: string[];
  received: string[];
}

export interface Trade {
  id: string;
  year: number;
  date: string | null;
  timestamp: number | null;
  sides: TradeSide[];
}

export interface RosterPlayer {
  name: string;
  position: string;
  slot: string;
  points: number;
  statLine: Record<string, number | string>;
}

export interface WeeklyTeamRoster {
  teamId: string;
  players: RosterPlayer[];
}

export interface WeeklyRosters {
  year: number;
  leagueId: LeagueId;
  weeks: Record<number, WeeklyTeamRoster[]>;
}

export interface SeasonData {
  year: number;
  leagueId: LeagueId;
  teams: Team[];
  draft: DraftPick[];
  matchups: Matchup[];
  trades?: Trade[];
}

/**
 * League metadata
 */
export interface LeagueInfo {
  id: LeagueId;
  name: string;
  shortName: string;
  description?: string;
  years: number[]; // Available years of data
}

/**
 * Playoff result for a single year
 */
export interface PlayoffYear {
  year: number;
  champion: string;
  runnerUp: string;
  playoffTeams: string[]; // Other playoff teams (not champion/runner-up)
}

/**
 * Complete playoff history for a league
 */
export interface PlayoffHistory {
  leagueId: LeagueId;
  history: PlayoffYear[];
}

// =============================================================================
// Raw Yahoo Data Types (for transformation)
// =============================================================================

/**
 * New Yahoo API dump format lives in:
 *   src/data/{league}/{year}/season.json
 * Legacy column-oriented exports remain as Team.json / Draft.json / Matchup.json
 */

/**
 * Raw Yahoo Team export format (column-oriented)
 */
export interface RawYahooTeam {
  ID: string[];
  Name: string[];
  Commissioner: boolean[];
  Manager: string[];
  Rank: number[];
  'Playoff Seed': number[];
  Wins: number[];
  Losses: number[];
  Ties: number[];
  Image: string[];
}

/**
 * Raw Yahoo Draft export format (column-oriented)
 */
export interface RawYahooDraft {
  Pick: number[];
  Round: number[];
  'Team ID': string[];
  'Team Name': string[];
  'Player ID': string[];
  'First Name': string[];
  'Last Name': string[];
  'Avg. Pick': (number | null)[];
  'Avg. Round': (number | null)[];
  'Avg. Cost': string[];
  '% Drafted': string[];
}

/**
 * Raw Yahoo Matchup export format (column-oriented)
 */
export interface RawYahooMatchup {
  Week: number[];
  'Team 1 ID': string[];
  'Team 1 Name': string[];
  'Team 2 ID': string[];
  'Team 2 Name': string[];
  Complete: boolean[];
  Playoff: boolean[];
  Consolation: boolean[];
  'Team 1 Points': number[];
  'Team 2 Points': number[];
}
