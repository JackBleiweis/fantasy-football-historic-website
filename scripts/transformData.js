/**
 * Script to transform Yahoo Fantasy Football exports into our app format.
 * Run with: node scripts/transformData.js
 *
 * Raw files should be placed in: src/data/{league}/{year}/
 * Expected files: Team.json, Draft.json, Matchup.json
 * Output goes to: src/data/{league}/{year}.json
 *
 * IMPORTANT: Yahoo exports only include first names for managers.
 * If you have managers with the same first name (e.g., two "Jacks"),
 * update the TEAM_TO_MANAGER_MAP below to map first names to full names.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';

// =============================================================================
// CONFIGURATION
// =============================================================================

// Base path for all data (raw files in subfolders, transformed as .json)
const DATA_DIR = './src/data';

// Which seasons to transform (add new entries here)
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
  // LP League
  { league: 'lp', year: 2017 },
  { league: 'lp', year: 2018 },
  { league: 'lp', year: 2019 },
  { league: 'lp', year: 2020 },
  { league: 'lp', year: 2021 },
  { league: 'lp', year: 2022 },
  { league: 'lp', year: 2023 },
  { league: 'lp', year: 2024 },
];

// =============================================================================
// MANAGER NAME MAPPING
// =============================================================================
// Map Yahoo first names to full names for consistency with playoff history data.
// Key: lowercase first name from Yahoo export
// Value: full name to use in the app
//
// IMPORTANT: This map should include ALL managers so names match playoffs.json
// =============================================================================
const MANAGER_NAME_MAP = {
  // CWP League managers (Jack handled specially via TEAM_TO_MANAGER_MAP)
  ben: 'Ben Roher',
  dustin: 'Dustin Pulver',
  chase: 'Chase Bergman',
  ty: 'Ty Greenberg',
  jake: 'Jake Mintz',
  matthew: 'Matthew Garay',
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
  // Add LP League managers here as needed
};

// Special mapping for managers where first name alone isn't unique
// Maps: leagueId -> year -> teamId -> fullName
// Jack Bleiweis is always t.1 (Commissioner)
// Jack Beder's team ID varies by year
const TEAM_TO_MANAGER_MAP = {
  cwp: {
    // 2014-2015: Only Jack Bleiweis in the league
    2014: {
      't.1': 'Jack Bleiweis',
    },
    2015: {
      't.1': 'Jack Bleiweis',
    },
    // 2016: Jack Beder joins
    2016: {
      't.1': 'Jack Bleiweis',
      't.7': 'Jack Beder',
    },
    // 2017: Only Jack Bleiweis (Jack Beder not in league this year)
    2017: {
      't.1': 'Jack Bleiweis',
    },
    // 2018-2019: Jack Beder at t.10
    2018: {
      't.1': 'Jack Bleiweis',
      't.10': 'Jack Beder',
    },
    2019: {
      't.1': 'Jack Bleiweis',
      't.10': 'Jack Beder',
    },
    // 2020: Jack Beder at t.9
    2020: {
      't.1': 'Jack Bleiweis',
      't.9': 'Jack Beder',
    },
    // 2021-2023: Jack Beder at t.8
    2021: {
      't.1': 'Jack Bleiweis',
      't.8': 'Jack Beder',
    },
    2022: {
      't.1': 'Jack Bleiweis',
      't.8': 'Jack Beder',
    },
    2023: {
      't.1': 'Jack Bleiweis',
      't.8': 'Jack Beder',
    },
    // 2024-2025: Jack Beder at t.7
    2024: {
      't.1': 'Jack Bleiweis',
      't.7': 'Jack Beder',
    },
    2025: {
      't.1': 'Jack Bleiweis',
      't.7': 'Jack Beder',
    },
  },
  lp: {
    // LP: Jack Bleiweis and Matthew Weintraub - team IDs vary by year
    // Note: Matthew Weintraub (LP) is different from Matthew Garay (CWP)
    2017: {
      't.6': 'Jack Bleiweis',
      't.3': 'Matthew Weintraub',
    },
    2018: {
      't.6': 'Jack Bleiweis',
      't.3': 'Matthew Weintraub',
    },
    2019: {
      't.5': 'Jack Bleiweis',
      't.10': 'Matthew Weintraub',
    },
    2020: {
      't.10': 'Jack Bleiweis',
      't.2': 'Matthew Weintraub',
    },
    2021: {
      't.10': 'Jack Bleiweis',
      't.2': 'Matthew Weintraub',
    },
    2022: {
      't.10': 'Jack Bleiweis',
      't.2': 'Matthew Weintraub',
    },
    2023: {
      't.10': 'Jack Bleiweis',
      't.2': 'Matthew Weintraub',
    },
    2024: {
      't.10': 'Jack Bleiweis',
      't.2': 'Matthew Weintraub',
    },
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// Helper to simplify Yahoo Team IDs
function simplifyTeamId(fullId) {
  const match = fullId.match(/t\.\d+$/);
  return match ? match[0] : fullId;
}

// Get the correct manager name, handling duplicates
function getManagerName(rawName, teamId, leagueId, year) {
  // First check if this specific team has a mapped name for this year
  const yearMap = TEAM_TO_MANAGER_MAP[leagueId]?.[year];
  if (yearMap && yearMap[teamId]) {
    return yearMap[teamId];
  }

  // Then check generic name mapping
  const lowerName = rawName.toLowerCase();
  if (MANAGER_NAME_MAP[lowerName]) {
    return MANAGER_NAME_MAP[lowerName];
  }

  // Otherwise return original name (preserve casing)
  return rawName;
}

// =============================================================================
// TRANSFORM FUNCTIONS
// =============================================================================

// Transform Team data
function transformTeams(raw, leagueId, year) {
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

// Transform Draft data
function transformDraft(raw) {
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

// Transform Matchup data
function transformMatchups(raw) {
  const count = raw.Week.length;
  const matchups = [];

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

// Main transformation for a single season
function transformSeason(league, year) {
  // Raw files in: src/data/{league}/{year}/
  // Output to: src/data/{league}/{year}.json
  const inputDir = join(DATA_DIR, league, String(year));
  const teamPath = join(inputDir, 'Team.json');
  const draftPath = join(inputDir, 'Draft.json');
  const matchupPath = join(inputDir, 'Matchup.json');

  // Check if files exist
  if (!existsSync(teamPath)) {
    console.log(`⏭️  Skipping ${league}/${year} - Team.json not found`);
    return null;
  }
  if (!existsSync(draftPath)) {
    console.log(`⏭️  Skipping ${league}/${year} - Draft.json not found`);
    return null;
  }
  if (!existsSync(matchupPath)) {
    console.log(`⏭️  Skipping ${league}/${year} - Matchup.json not found`);
    return null;
  }

  console.log(`📂 Transforming ${league}/${year}...`);

  const rawTeam = JSON.parse(readFileSync(teamPath, 'utf-8'));
  const rawDraft = JSON.parse(readFileSync(draftPath, 'utf-8'));
  const rawMatchup = JSON.parse(readFileSync(matchupPath, 'utf-8'));

  const data = {
    year,
    leagueId: league,
    teams: transformTeams(rawTeam, league, year),
    draft: transformDraft(rawDraft),
    matchups: transformMatchups(rawMatchup),
  };

  // Write output as {year}.json in the league folder
  const outputPath = join(DATA_DIR, league, `${year}.json`);
  writeFileSync(outputPath, JSON.stringify(data, null, 2));

  console.log(`✅ Wrote ${outputPath}`);
  console.log(`   - ${data.teams.length} teams`);
  console.log(`   - ${data.draft.length} draft picks`);
  console.log(`   - ${data.matchups.length} matchups`);

  return data;
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

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
