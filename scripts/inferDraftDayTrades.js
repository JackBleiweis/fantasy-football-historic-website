/**
 * Propose CWP draft-day pick trades from the draft board (not Yahoo transactions).
 *
 * Snake-draft assumptions:
 * - Each team has a home slot (the slot they occupy in most rounds).
 * - Odd rounds pick in slot order; even rounds reverse (snake).
 * - Same-round 2-cycles (A picks B's slot, B picks A's) are one swap.
 * - Extra/missing picks across rounds (A has two in R1, B has none; reverse later)
 *   are the other common pattern.
 * - All movements between the same two managers collapse into one trade.
 * - A leftover 3-team loop in a round is often a flipped pick: A and B
 *   swapped, then A later sent B's pick to C. If A already has 2-team
 *   trades with both B and C, fold the loop into those two trades.
 * - Other 3+ team cycles are left unresolved for review.
 *
 * Usage:
 *   node scripts/inferDraftDayTrades.js cwp 2026
 *
 * Prints a proposal. Does not write curated data — edit
 * src/data/cwp/draft-day-trades.json after review.
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const league = process.argv[2] || 'cwp';
const year = Number(process.argv[3] || 2026);
const seasonPath = join(ROOT, 'src/data', league, `${year}.json`);
const season = JSON.parse(readFileSync(seasonPath, 'utf-8'));

const teams = season.teams;
const draft = season.draft;
const N = teams.length;
const teamById = Object.fromEntries(teams.map((t) => [t.id, t]));

function originalSlot(pick) {
  const round = Math.ceil(pick / N);
  const posInRound = ((pick - 1) % N) + 1;
  return round % 2 === 1 ? posInRound : N + 1 - posInRound;
}

function formatPick(pick) {
  const round = Math.ceil(pick / N);
  const pos = ((pick - 1) % N) + 1;
  return `${round}.${String(pos).padStart(2, '0')}`;
}

function pickPayload(p) {
  return {
    pick: p.pick,
    round: p.round,
    roundPick: ((p.pick - 1) % N) + 1,
    slot: originalSlot(p.pick),
    label: formatPick(p.pick),
    playerId: p.playerId,
    playerFirstName: p.playerFirstName,
    playerLastName: p.playerLastName,
  };
}

function mode(values) {
  const counts = new Map();
  for (const v of values) counts.set(v, (counts.get(v) || 0) + 1);
  let best = values[0];
  let bestN = 0;
  for (const [v, n] of counts) {
    if (n > bestN) {
      best = v;
      bestN = n;
    }
  }
  return best;
}

const homeSlot = {};
for (const t of teams) {
  const slots = draft
    .filter((p) => p.teamId === t.id)
    .map((p) => originalSlot(p.pick));
  homeSlot[t.id] = mode(slots);
}

const ownerBySlot = {};
for (const t of teams) ownerBySlot[homeSlot[t.id]] = t.id;

const used = new Set(); // overall pick numbers already assigned to a 2-team trade
const pairMoves = new Map(); // "a|b" sorted team ids -> { aToB: picks, bToA: picks }

function pairKey(a, b) {
  return [a, b].sort().join('|');
}

function ensurePair(teamA, teamB) {
  const key = pairKey(teamA, teamB);
  if (!pairMoves.has(key)) {
    pairMoves.set(key, { a: teamA, b: teamB, aSent: [], bSent: [] });
  }
  return pairMoves.get(key);
}

function addMovement(fromTeam, toTeam, pick, { allowReuse = false } = {}) {
  if (!allowReuse && used.has(pick.pick)) return;
  used.add(pick.pick);
  const rec = ensurePair(fromTeam, toTeam);
  const payload = { ...pick };
  if (rec.a === fromTeam) rec.aSent.push(payload);
  else rec.bSent.push(payload);
}

function addSwap(teamA, teamB, pickFromA, pickFromB) {
  if (used.has(pickFromA.pick) || used.has(pickFromB.pick)) return;
  addMovement(teamA, teamB, pickFromA);
  addMovement(teamB, teamA, pickFromB, { allowReuse: true });
}

const maxRound = Math.max(...draft.map((p) => p.round));
const byRound = new Map();
for (const p of draft) {
  if (!byRound.has(p.round)) byRound.set(p.round, []);
  byRound.get(p.round).push(p);
}

// Pattern 1: same-round 2-cycles (A on B's slot, B on A's slot)
for (let r = 1; r <= maxRound; r++) {
  const picks = byRound.get(r) || [];
  const pickerBySlot = {};
  for (const p of picks) pickerBySlot[originalSlot(p.pick)] = p;

  const visited = new Set();
  for (let slot = 1; slot <= N; slot++) {
    if (visited.has(slot)) continue;
    const pick = pickerBySlot[slot];
    if (!pick) continue;
    const picker = pick.teamId;
    const pickerHome = homeSlot[picker];
    if (pickerHome === slot) {
      visited.add(slot);
      continue;
    }
    const returnPick = pickerBySlot[pickerHome];
    if (!returnPick) {
      visited.add(slot);
      continue;
    }
    const returnPicker = returnPick.teamId;
    const returnHome = homeSlot[returnPicker];
    // 2-cycle: A picked B's slot, B picked A's slot
    if (returnHome === slot && returnPicker !== picker) {
      visited.add(slot);
      visited.add(pickerHome);
      addSwap(
        ownerBySlot[slot],
        picker,
        pickPayload(pick),
        pickPayload(returnPick)
      );
    }
  }
}

// Pattern 2: extra/missing complementary picks (not already used)
const remaining = draft.filter((p) => !used.has(p.pick));
const extras = []; // pick used by someone other than home-slot owner
for (const p of remaining) {
  const slot = originalSlot(p.pick);
  const homeOwner = ownerBySlot[slot];
  if (p.teamId !== homeOwner) {
    extras.push({ pick: p, homeOwner, actual: p.teamId });
  }
}

// Bidirectional leftover edges: A used B's unused slot pick, B used A's
const leftoverByPair = new Map();
for (const extra of extras) {
  const key = pairKey(extra.homeOwner, extra.actual);
  if (!leftoverByPair.has(key)) leftoverByPair.set(key, []);
  leftoverByPair.get(key).push(extra);
}

for (const [key, list] of leftoverByPair) {
  const [idA, idB] = key.split('|');
  const aToB = list.filter((e) => e.homeOwner === idA && e.actual === idB);
  const bToA = list.filter((e) => e.homeOwner === idB && e.actual === idA);
  const n = Math.min(aToB.length, bToA.length);
  if (n === 0) continue;
  // Pair greedily by pick order so 2-for-2 extras become one collapsed trade
  for (let i = 0; i < n; i++) {
    addSwap(idA, idB, pickPayload(aToB[i].pick), pickPayload(bToA[i].pick));
  }
}

// Pattern 3: leftover 3-cycles that are a flipped pick through a hub.
// Example: A and B swap round 9, then A later sends B's 9th to C, so the
// board shows A→B, B→C, C→A even though it was two 2-team trades.
for (let r = 1; r <= maxRound; r++) {
  const picks = byRound.get(r) || [];
  const pickerBySlot = {};
  for (const p of picks) pickerBySlot[originalSlot(p.pick)] = p;

  const visited = new Set();
  for (let start = 1; start <= N; start++) {
    if (visited.has(start)) continue;
    const startPick = pickerBySlot[start];
    if (!startPick || used.has(startPick.pick)) continue;
    if (startPick.teamId === ownerBySlot[start]) continue;

    const cycleSlots = [];
    let slot = start;
    let isCycle = true;
    while (!visited.has(slot)) {
      const pick = pickerBySlot[slot];
      if (!pick || used.has(pick.pick) || pick.teamId === ownerBySlot[slot]) {
        isCycle = false;
        break;
      }
      visited.add(slot);
      cycleSlots.push(slot);
      slot = homeSlot[pick.teamId];
      if (slot === start) break;
      if (cycleSlots.includes(slot)) {
        isCycle = false;
        break;
      }
    }
    if (!isCycle || slot !== start || cycleSlots.length !== 3) continue;

    const cycleTeams = cycleSlots.map((s) => ownerBySlot[s]);
    const hubs = cycleTeams.filter((team) =>
      cycleTeams
        .filter((other) => other !== team)
        .every((other) => pairMoves.has(pairKey(team, other)))
    );
    if (hubs.length !== 1) continue;

    const hub = hubs[0];
    for (const fromSlot of cycleSlots) {
      const pick = pickerBySlot[fromSlot];
      const fromTeam = ownerBySlot[fromSlot];
      const toTeam = pick.teamId;
      if (fromTeam === hub || toTeam === hub) {
        addMovement(fromTeam, toTeam, pickPayload(pick));
      } else {
        addMovement(fromTeam, hub, pickPayload(pick), { allowReuse: true });
        addMovement(hub, toTeam, pickPayload(pick), { allowReuse: true });
      }
    }
  }
}

function side(teamId, sent, received) {
  const team = teamById[teamId];
  return {
    teamId,
    teamName: team.name,
    manager: team.manager,
    sent: sent.sort((a, b) => a.pick - b.pick),
    received: received.sort((a, b) => a.pick - b.pick),
  };
}

const trades = [...pairMoves.values()]
  .map((rec) => ({
    leagueId: league,
    year,
    confidence: 'needs_review',
    sides: [
      side(rec.a, rec.aSent, rec.bSent),
      side(rec.b, rec.bSent, rec.aSent),
    ],
  }))
  .sort((a, b) => {
    const aMin = Math.min(
      ...a.sides[0].sent.map((p) => p.pick),
      ...a.sides[1].sent.map((p) => p.pick)
    );
    const bMin = Math.min(
      ...b.sides[0].sent.map((p) => p.pick),
      ...b.sides[1].sent.map((p) => p.pick)
    );
    return aMin - bMin;
  })
  .map((trade, index) => ({
    id: `${league}-${year}-draft-trade-${index + 1}`,
    ...trade,
  }));

// Unresolved: remaining off-slot picks
const unresolvedPicks = draft.filter((p) => {
  if (used.has(p.pick)) return false;
  return p.teamId !== ownerBySlot[originalSlot(p.pick)];
});

const unresolved = [];
if (unresolvedPicks.length) {
  // Group by round for readability
  const byR = new Map();
  for (const p of unresolvedPicks) {
    if (!byR.has(p.round)) byR.set(p.round, []);
    byR.get(p.round).push(p);
  }
  for (const [round, picks] of [...byR.entries()].sort((a, b) => a[0] - b[0])) {
    unresolved.push({
      id: `${league}-${year}-draft-unresolved-r${round}`,
      leagueId: league,
      year,
      round,
      confidence: 'needs_review',
      notes:
        picks.length >= 3
          ? `Round ${round} looks like a ${picks.length}-team loop, not a 2-team swap.`
          : `Round ${round} still has off-slot picks that did not pair into a 2-team trade.`,
      picks: picks
        .sort((a, b) => a.pick - b.pick)
        .map((p) => {
          const homeOwner = teamById[ownerBySlot[originalSlot(p.pick)]];
          const actual = teamById[p.teamId];
          return {
            ...pickPayload(p),
            originalManager: homeOwner.manager,
            originalTeamName: homeOwner.name,
            actualManager: actual.manager,
            actualTeamName: actual.name,
            actualTeamId: actual.id,
          };
        }),
    });
  }
}

function printSide(s) {
  const labels = s.sent.map((p) => p.label).join(', ');
  return `${s.manager} (${s.teamName}) sent ${labels || '—'}`;
}

console.log(`Home slots (${league} ${year}, ${N} teams):`);
for (const t of teams) {
  console.log(
    `  slot ${String(homeSlot[t.id]).padStart(2)}  ${t.manager}  ·  ${t.name}`
  );
}
console.log(`\nProposed 2-team trades (${trades.length}):\n`);
for (const trade of trades) {
  console.log(`  ${trade.id}`);
  console.log(`    ${printSide(trade.sides[0])}`);
  console.log(`    ${printSide(trade.sides[1])}`);
  console.log('');
}
if (unresolved.length) {
  console.log(`Unresolved (needs review):`);
  for (const u of unresolved) {
    console.log(`  ${u.notes}`);
    for (const p of u.picks) {
      console.log(
        `    ${p.label} used by ${p.actualManager} (home slot: ${p.originalManager}) → ${p.playerFirstName} ${p.playerLastName}`
      );
    }
  }
} else {
  console.log('No unresolved off-slot picks.');
}

console.log(
  '\n--- JSON proposal (copy into draft-day-trades.json after review) ---\n'
);
console.log(JSON.stringify({ leagueId: league, trades, unresolved }, null, 2));
