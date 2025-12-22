/**
 * Utility functions for working with team data
 */

import type { Team } from '../types';

/**
 * Create a lookup map from team ID to team data
 */
export function createTeamLookup(teams: Team[]): Map<string, Team> {
  return new Map(teams.map((team) => [team.id, team]));
}

/**
 * Get manager name for a team ID
 */
export function getManagerByTeamId(
  teamId: string,
  teams: Team[]
): string | null {
  const team = teams.find((t) => t.id === teamId);
  return team?.manager ?? null;
}

/**
 * Get team by ID from a teams array
 */
export function getTeamById(teamId: string, teams: Team[]): Team | null {
  return teams.find((t) => t.id === teamId) ?? null;
}
