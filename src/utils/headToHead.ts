import type { LeagueId } from '../types';
import { getAvailableYears, getSeasonData } from '../data';

export interface HeadToHeadRecord {
  opponent: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  games: number;
}

export interface HeadToHeadGame {
  year: number;
  week: number;
  matchupTeam1Id: string;
  myTeamId: string;
  myTeamName: string;
  myPoints: number;
  theirTeamId: string;
  theirTeamName: string;
  theirPoints: number;
  isPlayoff: boolean;
  isConsolation: boolean;
  result: 'W' | 'L' | 'T';
}

function emptyRecord(opponent: string): HeadToHeadRecord {
  return {
    opponent,
    wins: 0,
    losses: 0,
    ties: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    games: 0,
  };
}

function applyGame(
  record: HeadToHeadRecord,
  myPoints: number,
  theirPoints: number
) {
  record.games += 1;
  record.pointsFor += myPoints;
  record.pointsAgainst += theirPoints;
  if (myPoints > theirPoints) record.wins += 1;
  else if (myPoints < theirPoints) record.losses += 1;
  else record.ties += 1;
}

export function getHeadToHeadRecords(
  managerName: string,
  leagueId: LeagueId,
  options: { playoffsOnly?: boolean } = {}
): HeadToHeadRecord[] {
  const records = new Map<string, HeadToHeadRecord>();
  const lower = managerName.toLowerCase();

  for (const year of getAvailableYears(leagueId)) {
    const season = getSeasonData(leagueId, year);
    if (!season) continue;

    const team = season.teams.find((t) => t.manager.toLowerCase() === lower);
    if (!team) continue;

    for (const matchup of season.matchups) {
      if (!matchup.isComplete) continue;
      if (matchup.isConsolation) continue;

      const isPlayoff = matchup.isPlayoff;
      if (options.playoffsOnly && !isPlayoff) continue;
      if (!options.playoffsOnly && isPlayoff) continue;

      const isTeam1 = matchup.team1Id === team.id;
      const isTeam2 = matchup.team2Id === team.id;
      if (!isTeam1 && !isTeam2) continue;

      const opponentTeam = season.teams.find(
        (t) => t.id === (isTeam1 ? matchup.team2Id : matchup.team1Id)
      );
      const opponent = opponentTeam?.manager || (isTeam1 ? matchup.team2Name : matchup.team1Name);
      const existing = records.get(opponent) || emptyRecord(opponent);
      applyGame(
        existing,
        isTeam1 ? matchup.team1Points : matchup.team2Points,
        isTeam1 ? matchup.team2Points : matchup.team1Points
      );
      records.set(opponent, existing);
    }
  }

  return Array.from(records.values()).sort((a, b) => b.games - a.games);
}

export function getHeadToHeadMatchups(
  managerName: string,
  opponentName: string,
  leagueId: LeagueId,
  options: { playoffsOnly?: boolean } = {}
): HeadToHeadGame[] {
  const games: HeadToHeadGame[] = [];
  const myName = managerName.toLowerCase();
  const theirName = opponentName.toLowerCase();

  for (const year of getAvailableYears(leagueId)) {
    const season = getSeasonData(leagueId, year);
    if (!season) continue;

    const myTeam = season.teams.find((t) => t.manager.toLowerCase() === myName);
    if (!myTeam) continue;

    for (const matchup of season.matchups) {
      if (!matchup.isComplete) continue;
      if (matchup.isConsolation) continue;

      const isPlayoff = matchup.isPlayoff;
      if (options.playoffsOnly && !isPlayoff) continue;

      const isTeam1 = matchup.team1Id === myTeam.id;
      const isTeam2 = matchup.team2Id === myTeam.id;
      if (!isTeam1 && !isTeam2) continue;

      const opponentTeam = season.teams.find(
        (t) => t.id === (isTeam1 ? matchup.team2Id : matchup.team1Id)
      );
      const opponent =
        opponentTeam?.manager ||
        (isTeam1 ? matchup.team2Name : matchup.team1Name);
      if (opponent.toLowerCase() !== theirName) continue;

      const myPoints = isTeam1 ? matchup.team1Points : matchup.team2Points;
      const theirPoints = isTeam1 ? matchup.team2Points : matchup.team1Points;
      const result: HeadToHeadGame['result'] =
        myPoints > theirPoints ? 'W' : myPoints < theirPoints ? 'L' : 'T';

      games.push({
        year,
        week: matchup.week,
        matchupTeam1Id: matchup.team1Id,
        myTeamId: myTeam.id,
        myTeamName: isTeam1 ? matchup.team1Name : matchup.team2Name,
        myPoints,
        theirTeamId: isTeam1 ? matchup.team2Id : matchup.team1Id,
        theirTeamName: isTeam1 ? matchup.team2Name : matchup.team1Name,
        theirPoints,
        isPlayoff,
        isConsolation: matchup.isConsolation,
        result,
      });
    }
  }

  return games.sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return b.week - a.week;
  });
}
