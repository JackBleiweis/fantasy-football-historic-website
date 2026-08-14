/**
 * Script to transform Yahoo Fantasy Football exports into our app format.
 * Run with: node scripts/transformData.js
 *
 * Preferred raw input (new Yahoo API dump):
 *   src/data/{league}/{year}/season.json
 *
 * Legacy raw input (old column-oriented exports):
 *   src/data/{league}/{year}/Team.json
 *   src/data/{league}/{year}/Draft.json
 *   src/data/{league}/{year}/Matchup.json
 *
 * Output:
 *   src/data/{league}/{year}.json
 *
 * Playoff champions / runner-up / playoff teams stay in:
 *   src/data/{league}/playoffs.json
 *
 * Draft-day pick trades are curated separately (not from Yahoo transactions):
 *   src/data/{league}/draft-day-trades.json
 * Propose new years with: node scripts/inferDraftDayTrades.js cwp 2026
 *
 * Yahoo only gives manager nicknames. Use MANAGER_NAME_MAP and
 * TEAM_TO_MANAGER_MAP to resolve full names.
 *
 * League-specific scoring quirks (e.g. CWP two-week finals):
 *   scripts/LEAGUE_QUIRKS.md
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// =============================================================================
// CONFIGURATION
// =============================================================================

const DATA_DIR = './src/data';

const SEASONS_TO_TRANSFORM = [
  // CWP League
  { league: 'cwp', year: 2014 },
  { league: 'cwp', year: 2015 },
  { league: 'cwp', year: 2016 },
  { league: 'cwp', year: 2017 },
  { league: 'cwp', year: 2018 },
  { league: 'cwp', year: 2019 },
  { league: 'cwp', year: 2020 },
  { league: 'cwp', year: 2021 },
  { league: 'cwp', year: 2022 },
  { league: 'cwp', year: 2023 },
  { league: 'cwp', year: 2024 },
  { league: 'cwp', year: 2025 },
  { league: 'cwp', year: 2026 },
  // LP League
  { league: 'lp', year: 2017 },
  { league: 'lp', year: 2018 },
  { league: 'lp', year: 2019 },
  { league: 'lp', year: 2020 },
  { league: 'lp', year: 2021 },
  { league: 'lp', year: 2022 },
  { league: 'lp', year: 2023 },
  { league: 'lp', year: 2024 },
  { league: 'lp', year: 2025 },
];

// =============================================================================
// MANAGER NAME MAPPING
// =============================================================================
const MANAGER_NAME_MAP = {
  // CWP League managers (Jack handled specially via TEAM_TO_MANAGER_MAP)
  ben: 'Ben Roher',
  dustin: 'Dustin Pulver',
  chase: 'Chase Bergman',
  ty: 'Ty Greenberg',
  jake: 'Jake Mintz',
  matthew: 'Matthew Garay', // CWP Matthew - LP Matthew handled via TEAM_TO_MANAGER_MAP
  michael: 'Michael Kagan',
  buddy: 'Buddy Marcello',
  zach: 'Zach Weisleder',
  grant: 'Grant Roth',
  alex: 'Alex Borje',
  hayden: 'Hayden Katz',
  david: 'David Rumack',
  jeff: 'Jeff Roebuck',
  josh: 'Josh Green',
  'josh b': 'Josh Bleiweis',

  // LP League managers (Jack & Matthew handled via TEAM_TO_MANAGER_MAP)
  james: 'James Ellement',
  joe: 'Joe Glibbery',
  harrison: 'Harrison Wood',
  lucas: 'Lucas Stagliano',
  heri: 'Heri Hickl Szabo',
  kevin: 'Kevin McCreary',
  ryan: 'Ryan Schwartz',
  gabriel: 'Gabriel Nadra',
  gabe: 'Gabriel Nadra',
  ian: "Ian O'Handley",
  william: 'William Davison',
  will: 'William Davison',
  declan: 'Declan Brown',

  // Sleeper usernames (Dirty Dozen 2025+)
  je10je10: 'James Ellement',
  lucasstagzz: 'Lucas Stagliano',
  nextlevelwood7: 'Harrison Wood',
  jackb9: 'Jack Bleiweis',
  gabenadra: 'Gabriel Nadra',
  kevinmcc17: 'Kevin McCreary',
  willdvsn: 'William Davison',
  buartszn: 'Matthew Weintraub',
  ryguy3333333: 'Ryan Schwartz',
  iohandley: "Ian O'Handley",
  jglibb47: 'Joe Glibbery',
  herisanders: 'Heri Hickl Szabo',
};

// Maps: leagueId -> year -> teamId -> fullName
const TEAM_TO_MANAGER_MAP = {
  cwp: {
    2014: { 't.1': 'Jack Bleiweis' },
    2015: { 't.1': 'Jack Bleiweis', 't.10': 'Ben Roher' },
    2016: { 't.1': 'Jack Bleiweis', 't.7': 'Jack Beder', 't.4': 'Ben Roher' },
    // 2017 t.8 "Show me your TD's" was Ben (same team name as other Ben seasons)
    2017: { 't.1': 'Jack Bleiweis', 't.8': 'Ben Roher' },
    2018: {
      't.1': 'Jack Bleiweis',
      't.10': 'Jack Beder',
      't.4': 'Michael Kagan',
    },
    2019: { 't.1': 'Jack Bleiweis', 't.10': 'Jack Beder' },
    2020: { 't.1': 'Jack Bleiweis', 't.9': 'Jack Beder' },
    2021: { 't.1': 'Jack Bleiweis', 't.8': 'Jack Beder' },
    2022: { 't.1': 'Jack Bleiweis', 't.8': 'Jack Beder' },
    2023: { 't.1': 'Jack Bleiweis', 't.8': 'Jack Beder' },
    2024: { 't.1': 'Jack Bleiweis', 't.7': 'Jack Beder' },
    2025: { 't.1': 'Jack Bleiweis', 't.7': 'Jack Beder' },
    2026: { 't.1': 'Jack Bleiweis', 't.7': 'Jack Beder' },
  },
  lp: {
    2017: { 't.6': 'Jack Bleiweis', 't.3': 'Matthew Weintraub' },
    2018: { 't.6': 'Jack Bleiweis', 't.3': 'Matthew Weintraub' },
    2019: { 't.5': 'Jack Bleiweis', 't.10': 'Matthew Weintraub' },
    2020: { 't.10': 'Jack Bleiweis', 't.2': 'Matthew Weintraub' },
    2021: { 't.10': 'Jack Bleiweis', 't.2': 'Matthew Weintraub' },
    2022: { 't.10': 'Jack Bleiweis', 't.2': 'Matthew Weintraub' },
    2023: { 't.10': 'Jack Bleiweis', 't.2': 'Matthew Weintraub' },
    2024: { 't.10': 'Jack Bleiweis', 't.2': 'Matthew Weintraub' },
    // Sleeper 2025: team IDs are roster IDs; map every team for safety
    2025: {
      't.1': 'James Ellement',
      't.2': 'Lucas Stagliano',
      't.3': 'Harrison Wood',
      't.4': 'Jack Bleiweis',
      't.5': 'Gabriel Nadra',
      't.6': 'Kevin McCreary',
      't.7': 'William Davison',
      't.8': 'Matthew Weintraub',
      't.9': 'Ryan Schwartz',
      't.10': "Ian O'Handley",
      't.11': 'Joe Glibbery',
      't.12': 'Heri Hickl Szabo',
    },
  },
};

/**
 * CWP championship finals that Yahoo stores as a multi-week COMBINED total on
 * one matchup row (usually week 17). See scripts/LEAGUE_QUIRKS.md.
 *
 * When listed here, transform rewrites that week's matchup points to the
 * single-week roster starter total and sets isMultiWeekFinal: true.
 */
const MULTI_WEEK_CHAMPIONSHIP_FINALS = {
  cwp: {
    2021: { week: 17 },
    2022: { week: 17 },
    2023: { week: 17 },
    2024: { week: 17 },
    2025: { week: 17 },
  },
};

// =============================================================================
// HELPERS
// =============================================================================

function simplifyTeamId(fullId) {
  if (fullId == null) return '';
  const asString = String(fullId);
  const match = asString.match(/t\.\d+$/);
  if (match) return match[0];
  if (/^\d+$/.test(asString)) return `t.${asString}`;
  return asString;
}

function getManagerName(rawName, teamId, leagueId, year) {
  const yearMap = TEAM_TO_MANAGER_MAP[leagueId]?.[year];
  if (yearMap && yearMap[teamId]) {
    return yearMap[teamId];
  }

  const lowerName = String(rawName || '').toLowerCase();
  if (MANAGER_NAME_MAP[lowerName]) {
    return MANAGER_NAME_MAP[lowerName];
  }

  return rawName;
}

function splitPlayerName(fullName) {
  const name = String(fullName || '').trim();
  if (!name) return { first: '', last: '' };
  const parts = name.split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

function extractPlayerId(playerKey) {
  if (!playerKey) return '';
  const match =
    String(playerKey).match(/\.p\.(\d+)$/) ||
    String(playerKey).match(/^(\d+)$/);
  return match ? match[1] : String(playerKey);
}

function getTeamLogoUrl(team) {
  const logos = team.team_logos || [];
  const first = logos[0]?.team_logo?.url || logos[0]?.url;
  if (first) return first;
  if (team.avatar) {
    return `https://sleepercdn.com/avatars/thumbs/${team.avatar}`;
  }
  return '';
}

function getRawManagerNickname(team) {
  const managers = team.managers || [];
  const first = managers[0];
  if (!first) return '';
  if (typeof first === 'string') return first;
  return first.nickname || first.username || '';
}

function toBooleanFlag(value) {
  return value === true || value === 1 || value === '1';
}

function isSleeperSeason(season) {
  return (
    season?.platform === 'sleeper' ||
    String(season?.league_key || '').startsWith('sleeper.') ||
    String(season?.source || '').includes('sleeper')
  );
}

/**
 * Sleeper standings often include H2H + vs-median (~2x). Rebuild W/L/T
 * from regular-season scoreboard games instead.
 */
function recalculateRecordsFromScoreboard(season) {
  const records = new Map();

  const ensure = (teamId) => {
    if (!records.has(teamId)) {
      records.set(teamId, { wins: 0, losses: 0, ties: 0 });
    }
    return records.get(teamId);
  };

  for (const weekBoard of season.scoreboard || []) {
    for (const matchup of weekBoard.matchups || []) {
      if (
        toBooleanFlag(matchup.is_playoffs) ||
        toBooleanFlag(matchup.is_consolation)
      ) {
        continue;
      }
      const teams = matchup.teams || [];
      if (teams.length < 2) continue;

      const team1Id = simplifyTeamId(teams[0].team_key || teams[0].team_id);
      const team2Id = simplifyTeamId(teams[1].team_key || teams[1].team_id);
      const p1 = Number(teams[0].points ?? 0);
      const p2 = Number(teams[1].points ?? 0);
      const r1 = ensure(team1Id);
      const r2 = ensure(team2Id);

      if (p1 > p2) {
        r1.wins += 1;
        r2.losses += 1;
      } else if (p2 > p1) {
        r2.wins += 1;
        r1.losses += 1;
      } else {
        r1.ties += 1;
        r2.ties += 1;
      }
    }
  }

  return records;
}

function buildRosterIdToTeamId(season) {
  const map = new Map();
  for (const team of season.teams || []) {
    if (team.roster_id != null) {
      map.set(team.roster_id, simplifyTeamId(team.team_key || team.team_id));
    }
  }
  return map;
}

// =============================================================================
// NEW API DUMP TRANSFORM
// =============================================================================

function transformApiTeams(season, leagueId, year) {
  const sleeperRecords = isSleeperSeason(season)
    ? recalculateRecordsFromScoreboard(season)
    : null;

  return season.teams.map((team) => {
    const teamId = simplifyTeamId(team.team_key || team.team_id);
    const standings = team.standings || {};
    const manager = getManagerName(
      getRawManagerNickname(team),
      teamId,
      leagueId,
      year
    );
    const rebuilt = sleeperRecords?.get(teamId);

    return {
      id: teamId,
      name: team.name,
      manager,
      wins: rebuilt?.wins ?? standings.wins ?? 0,
      losses: rebuilt?.losses ?? standings.losses ?? 0,
      ties: rebuilt?.ties ?? standings.ties ?? 0,
      rank: standings.rank ?? 0,
      playoffSeed: standings.playoff_seed ?? 0,
      isCommissioner: manager === 'Jack Bleiweis',
      imageUrl: getTeamLogoUrl(team),
      moves: Number(team.number_of_moves ?? 0),
      tradesCount: Number(team.number_of_trades ?? 0),
    };
  });
}

function transformApiDraft(season) {
  return (season.draft_results || []).map((pick) => {
    const { first, last } = splitPlayerName(pick.player_name);
    return {
      pick: pick.pick,
      round: pick.round,
      teamId: simplifyTeamId(
        pick.team_key || (pick.roster_id != null ? `t.${pick.roster_id}` : '')
      ),
      teamName: pick.team_name || '',
      playerId:
        extractPlayerId(pick.player_key) || String(pick.player_id || ''),
      playerFirstName: first,
      playerLastName: last,
      avgPick: pick.avg_pick ?? null,
      avgRound: pick.avg_round ?? null,
    };
  });
}

function transformApiMatchups(season) {
  const matchups = [];
  const consolationPairs = new Set();

  // Sleeper: losers bracket games are consolation, not playoffs
  for (const game of season.losers_bracket || []) {
    if (game.t1 == null || game.t2 == null) continue;
    const a = String(game.t1);
    const b = String(game.t2);
    consolationPairs.add([a, b].sort().join(':'));
  }

  for (const weekBoard of season.scoreboard || []) {
    for (const matchup of weekBoard.matchups || []) {
      const teams = matchup.teams || [];
      const team1 = teams[0] || {};
      const team2 = teams[1] || {};
      const team1Id = simplifyTeamId(team1.team_key || team1.team_id);
      const team2Id = simplifyTeamId(team2.team_key || team2.team_id);

      const pairKey = [team1Id.replace(/^t\./, ''), team2Id.replace(/^t\./, '')]
        .sort()
        .join(':');
      const isConsolation =
        toBooleanFlag(matchup.is_consolation) || consolationPairs.has(pairKey);
      // Consolation games should never count/display as playoffs
      const isPlayoff = toBooleanFlag(matchup.is_playoffs) && !isConsolation;

      matchups.push({
        week: matchup.week ?? weekBoard.week,
        team1Id,
        team1Name: team1.name || '',
        team1Points: Number(team1.points ?? 0),
        team2Id,
        team2Name: team2.name || '',
        team2Points: Number(team2.points ?? 0),
        isComplete:
          matchup.status === 'postevent' || matchup.status === 'midevent',
        isPlayoff,
        isConsolation,
      });
    }
  }

  return matchups;
}

function transformApiTrades(season, teams, year) {
  const managerByTeam = new Map(teams.map((t) => [t.id, t.manager]));
  const rosterIdToTeamId = buildRosterIdToTeamId(season);

  return (season.trades || []).map((trade, index) => ({
    id:
      trade.transaction_key || trade.transaction_id || `${year}-trade-${index}`,
    year,
    date: trade.date || null,
    timestamp: trade.timestamp || null,
    sides: (trade.sides || []).map((side) => {
      const teamId =
        simplifyTeamId(side.team_key) ||
        rosterIdToTeamId.get(side.roster_id) ||
        (side.roster_id != null ? `t.${side.roster_id}` : '');
      return {
        teamId,
        teamName: side.team_name || '',
        manager: managerByTeam.get(teamId) || '',
        sent: side.sent || [],
        received: side.received || [],
      };
    }),
  }));
}

function transformApiRosters(season, league, year) {
  const weeks = {};

  for (const weekBoard of season.weekly_rosters || []) {
    const week = weekBoard.week;
    weeks[week] = (weekBoard.teams || []).map((team) => ({
      teamId: simplifyTeamId(team.team_key),
      players: (team.players || []).map((player) => ({
        name: player.name || '',
        position: player.display_position || '',
        slot: player.selected_position || '',
        points: Number(player.points ?? 0),
        statLine: player.stat_line || {},
      })),
    }));
  }

  if (Object.keys(weeks).length === 0) return null;

  return {
    year,
    leagueId: league,
    weeks,
  };
}

function starterPointsFromRosters(rosters, week, teamId) {
  if (!rosters?.weeks?.[week]) return null;
  const team = rosters.weeks[week].find((t) => t.teamId === teamId);
  if (!team) return null;
  return team.players
    .filter((p) => p.slot !== 'BN' && p.slot !== 'IR' && p.slot !== 'NA')
    .reduce((sum, p) => sum + Number(p.points || 0), 0);
}

/**
 * Rewrite Yahoo's combined two-week championship total into a single-week score.
 */
function applyMultiWeekFinalFix(data, league, year) {
  const config = MULTI_WEEK_CHAMPIONSHIP_FINALS[league]?.[year];
  if (!config || !data.rosters) return data;

  const { week } = config;
  let fixed = 0;

  for (const matchup of data.matchups) {
    if (matchup.week !== week) continue;
    if (!matchup.isPlayoff || matchup.isConsolation) continue;

    const team1WeekPts = starterPointsFromRosters(
      data.rosters,
      week,
      matchup.team1Id
    );
    const team2WeekPts = starterPointsFromRosters(
      data.rosters,
      week,
      matchup.team2Id
    );

    // Only rewrite when Yahoo's total looks like a multi-week sum
    // (matchup points ≈ this week + previous week starters).
    const prev1 = starterPointsFromRosters(
      data.rosters,
      week - 1,
      matchup.team1Id
    );
    const prev2 = starterPointsFromRosters(
      data.rosters,
      week - 1,
      matchup.team2Id
    );

    if (team1WeekPts == null || team2WeekPts == null) continue;

    const looksCombined =
      prev1 != null &&
      prev2 != null &&
      Math.abs(matchup.team1Points - (prev1 + team1WeekPts)) < 0.5 &&
      Math.abs(matchup.team2Points - (prev2 + team2WeekPts)) < 0.5;

    if (!looksCombined) continue;

    matchup.team1Points = Number(team1WeekPts.toFixed(2));
    matchup.team2Points = Number(team2WeekPts.toFixed(2));
    matchup.isMultiWeekFinal = true;
    fixed += 1;
  }

  if (fixed > 0) {
    console.log(
      `   - multi-week final fix: rewrote ${fixed} week-${week} championship matchup(s) to single-week points`
    );
  }

  return data;
}

function transformApiSeason(season, league, year) {
  const teams = transformApiTeams(season, league, year);
  const data = {
    year,
    leagueId: league,
    teams,
    draft: transformApiDraft(season),
    matchups: transformApiMatchups(season),
    trades: transformApiTrades(season, teams, year),
    rosters: transformApiRosters(season, league, year),
  };
  return applyMultiWeekFinalFix(data, league, year);
}

// =============================================================================
// LEGACY COLUMN-ORIENTED TRANSFORM
// =============================================================================

function transformLegacyTeams(raw, leagueId, year) {
  const count = raw.ID.length;
  const teams = [];

  for (let i = 0; i < count; i++) {
    const teamId = simplifyTeamId(raw.ID[i]);
    teams.push({
      id: teamId,
      name: raw.Name[i],
      manager: getManagerName(raw.Manager[i], teamId, leagueId, year),
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

function transformLegacyDraft(raw) {
  const count = raw.Pick.length;
  const picks = [];

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

function transformLegacyMatchups(raw) {
  const count = raw.Week.length;
  const matchups = [];

  for (let i = 0; i < count; i++) {
    const isConsolation = !!raw.Consolation[i];
    const isPlayoff = !!raw.Playoff[i] && !isConsolation;
    matchups.push({
      week: raw.Week[i],
      team1Id: simplifyTeamId(raw['Team 1 ID'][i]),
      team1Name: raw['Team 1 Name'][i],
      team1Points: raw['Team 1 Points'][i],
      team2Id: simplifyTeamId(raw['Team 2 ID'][i]),
      team2Name: raw['Team 2 Name'][i],
      team2Points: raw['Team 2 Points'][i],
      isComplete: raw.Complete[i],
      isPlayoff,
      isConsolation,
    });
  }

  return matchups;
}

// =============================================================================
// MAIN
// =============================================================================

function transformSeason(league, year) {
  const inputDir = join(DATA_DIR, league, String(year));
  const apiPath = join(inputDir, 'season.json');
  const teamPath = join(inputDir, 'Team.json');
  const draftPath = join(inputDir, 'Draft.json');
  const matchupPath = join(inputDir, 'Matchup.json');
  const outputPath = join(DATA_DIR, league, `${year}.json`);

  let data;
  let source;

  if (existsSync(apiPath)) {
    console.log(`📂 Transforming ${league}/${year} (API dump)...`);
    const season = JSON.parse(readFileSync(apiPath, 'utf-8'));
    data = transformApiSeason(season, league, year);
    source = 'season.json';
  } else if (
    existsSync(teamPath) &&
    existsSync(draftPath) &&
    existsSync(matchupPath)
  ) {
    console.log(`📂 Transforming ${league}/${year} (legacy export)...`);
    data = {
      year,
      leagueId: league,
      teams: transformLegacyTeams(
        JSON.parse(readFileSync(teamPath, 'utf-8')),
        league,
        year
      ),
      draft: transformLegacyDraft(JSON.parse(readFileSync(draftPath, 'utf-8'))),
      matchups: transformLegacyMatchups(
        JSON.parse(readFileSync(matchupPath, 'utf-8'))
      ),
      trades: [],
      rosters: null,
    };
    source = 'Team/Draft/Matchup.json';
  } else {
    console.log(`⏭️  Skipping ${league}/${year} - no raw files found`);
    return null;
  }

  const { rosters, ...seasonOutput } = data;
  writeFileSync(outputPath, JSON.stringify(seasonOutput, null, 2));
  console.log(`✅ Wrote ${outputPath} from ${source}`);
  console.log(`   - ${seasonOutput.teams.length} teams`);
  console.log(`   - ${seasonOutput.draft.length} draft picks`);
  console.log(`   - ${seasonOutput.matchups.length} matchups`);
  if (seasonOutput.trades?.length) {
    console.log(`   - ${seasonOutput.trades.length} trades`);
  }
  if (rosters) {
    const rosterPath = join(DATA_DIR, league, `${year}-rosters.json`);
    writeFileSync(rosterPath, JSON.stringify(rosters));
    console.log(`   - wrote ${rosterPath}`);
  }
  console.log(
    `   - managers: ${seasonOutput.teams.map((t) => t.manager).join(', ')}`
  );

  return seasonOutput;
}

console.log('🏈 Fantasy Football Data Transformer\n');

let successCount = 0;
let skipCount = 0;

for (const { league, year } of SEASONS_TO_TRANSFORM) {
  const result = transformSeason(league, year);
  if (result) {
    successCount++;
  } else {
    skipCount++;
  }
}

console.log(`\n📊 Summary: ${successCount} transformed, ${skipCount} skipped`);
