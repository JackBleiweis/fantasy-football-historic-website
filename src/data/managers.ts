/**
 * Centralized Manager Configuration
 *
 * Each manager has a unique ID (first letter of first name + last name, lowercase)
 * For managers with only first names, use the first name as the ID.
 */

import type { LeagueId } from '../types';

// Import CWP avatar images
import dustinAvatar from '../assets/CWP/dustin.jpeg';
import bleiweisAvatar from '../assets/CWP/bleiweis.jpeg';
import tyAvatar from '../assets/CWP/ty.jpeg';
import chaseAvatar from '../assets/CWP/chase.jpeg';
import bederAvatar from '../assets/CWP/beder.jpeg';
import jakeAvatar from '../assets/CWP/jake.jpeg';
import buddyAvatar from '../assets/CWP/buddy.jpeg';
import matthewCwpAvatar from '../assets/CWP/matthew.jpeg';
import benAvatar from '../assets/CWP/ben.jpeg';
import michaelAvatar from '../assets/CWP/michael.jpeg';

// Import LP avatar images
import gabeAvatar from '../assets/LP/gabe.jpeg';
import harryAvatar from '../assets/LP/harry.jpeg';
import heriAvatar from '../assets/LP/heri.jpeg';
import ianAvatar from '../assets/LP/ian.jpeg';
import jamesAvatar from '../assets/LP/james.jpeg';
import joeAvatar from '../assets/LP/joe.jpeg';
import kevinAvatar from '../assets/LP/kevin.jpeg';
import lucasAvatar from '../assets/LP/lucas.jpeg';
import matthewLpAvatar from '../assets/LP/matthew.jpeg';
import ryanAvatar from '../assets/LP/ryan.jpeg';
import willAvatar from '../assets/LP/will.jpeg';

// =============================================================================
// TYPES
// =============================================================================

export interface Manager {
  id: string; // Unique ID: first letter + last name (e.g., "jbleiweis")
  fullName: string; // Display name
  firstName: string; // For matching Yahoo data
  lastName?: string; // Optional for first-name-only managers
  avatar?: string; // Avatar image
  leagues: LeagueId[]; // Which leagues they're in
}

// =============================================================================
// MANAGER DATABASE
// =============================================================================

export const managers: Manager[] = [
  // ========================
  // CWP League Managers
  // ========================
  {
    id: 'jbleiweis',
    fullName: 'Jack Bleiweis',
    firstName: 'Jack',
    lastName: 'Bleiweis',
    avatar: bleiweisAvatar,
    leagues: ['cwp', 'lp'], // In both leagues
  },
  {
    id: 'jbeder',
    fullName: 'Jack Beder',
    firstName: 'Jack',
    lastName: 'Beder',
    avatar: bederAvatar,
    leagues: ['cwp'],
  },
  {
    id: 'dpulver',
    fullName: 'Dustin Pulver',
    firstName: 'Dustin',
    lastName: 'Pulver',
    avatar: dustinAvatar,
    leagues: ['cwp'],
  },
  {
    id: 'mkagan',
    fullName: 'Michael Kagan',
    firstName: 'Michael',
    lastName: 'Kagan',
    avatar: michaelAvatar,
    leagues: ['cwp'],
  },
  {
    id: 'aklein',
    fullName: 'Andrew Klein',
    firstName: 'Andrew',
    lastName: 'Klein',
    avatar: undefined,
    leagues: ['cwp'],
  },
  {
    id: 'tgreenberg',
    fullName: 'Ty Greenberg',
    firstName: 'Ty',
    lastName: 'Greenberg',
    avatar: tyAvatar,
    leagues: ['cwp'],
  },
  {
    id: 'broher',
    fullName: 'Ben Roher',
    firstName: 'Ben',
    lastName: 'Roher',
    avatar: benAvatar,
    leagues: ['cwp'],
  },
  {
    id: 'jmintz',
    fullName: 'Jake Mintz',
    firstName: 'Jake',
    lastName: 'Mintz',
    avatar: jakeAvatar,
    leagues: ['cwp'],
  },
  {
    id: 'bmarcello',
    fullName: 'Buddy Marcello',
    firstName: 'Buddy',
    lastName: 'Marcello',
    avatar: buddyAvatar,
    leagues: ['cwp'],
  },
  {
    id: 'cbergman',
    fullName: 'Chase Bergman',
    firstName: 'Chase',
    lastName: 'Bergman',
    avatar: chaseAvatar,
    leagues: ['cwp'],
  },
  {
    id: 'mgaray',
    fullName: 'Matthew Garay',
    firstName: 'Matthew',
    lastName: 'Garay',
    avatar: matthewCwpAvatar,
    leagues: ['cwp'],
  },
  {
    id: 'zweisleder',
    fullName: 'Zach Weisleder',
    firstName: 'Zach',
    lastName: 'Weisleder',
    avatar: undefined,
    leagues: ['cwp'],
  },
  {
    id: 'groth',
    fullName: 'Grant Roth',
    firstName: 'Grant',
    lastName: 'Roth',
    avatar: undefined,
    leagues: ['cwp'],
  },
  {
    id: 'aborje',
    fullName: 'Alex Borje',
    firstName: 'Alex',
    lastName: 'Borje',
    avatar: undefined,
    leagues: ['cwp'],
  },
  {
    id: 'hkatz',
    fullName: 'Hayden Katz',
    firstName: 'Hayden',
    lastName: 'Katz',
    avatar: undefined,
    leagues: ['cwp'],
  },
  {
    id: 'drumack',
    fullName: 'David Rumack',
    firstName: 'David',
    lastName: 'Rumack',
    avatar: undefined,
    leagues: ['cwp'],
  },
  {
    id: 'jroebuck',
    fullName: 'Jeff Roebuck',
    firstName: 'Jeff',
    lastName: 'Roebuck',
    avatar: undefined,
    leagues: ['cwp'],
  },
  {
    id: 'spolan',
    fullName: 'Shane Polan',
    firstName: 'Shane',
    lastName: 'Polan',
    avatar: undefined,
    leagues: ['cwp'],
  },
  {
    id: 'jgreen',
    fullName: 'Josh Green',
    firstName: 'Josh',
    lastName: 'Green',
    avatar: undefined,
    leagues: ['cwp'],
  },
  {
    id: 'joshbleiweis',
    fullName: 'Josh Bleiweis',
    firstName: 'Josh',
    lastName: 'Bleiweis',
    avatar: undefined,
    leagues: ['cwp'],
  },

  // ========================
  // LP League Managers
  // ========================
  {
    id: 'mweintraub',
    fullName: 'Matthew Weintraub',
    firstName: 'Matthew',
    lastName: 'Weintraub',
    avatar: matthewLpAvatar,
    leagues: ['lp'],
  },
  {
    id: 'jEllement',
    fullName: 'James Ellement',
    firstName: 'James',
    lastName: 'Ellement',
    avatar: jamesAvatar,
    leagues: ['lp'],
  },
  {
    id: 'jGlibbery',
    fullName: 'Joe Glibbery',
    firstName: 'Joe',
    lastName: 'Glibbery',
    avatar: joeAvatar,
    leagues: ['lp'],
  },
  {
    id: 'hWood',
    fullName: 'Harrison Wood',
    firstName: 'Harrison',
    lastName: 'Wood',
    avatar: harryAvatar,
    leagues: ['lp'],
  },
  {
    id: 'lStagliano',
    fullName: 'Lucas Stagliano',
    firstName: 'Lucas',
    lastName: 'Stagliano',
    avatar: lucasAvatar,
    leagues: ['lp'],
  },
  {
    id: 'hHicklSzabo',
    fullName: 'Heri Hickl Szabo',
    firstName: 'Heri',
    lastName: 'Hickl Szabo',
    avatar: heriAvatar,
    leagues: ['lp'],
  },
  {
    id: 'kMcCreary',
    fullName: 'Kevin McCreary',
    firstName: 'Kevin',
    lastName: 'McCreary',
    avatar: kevinAvatar,
    leagues: ['lp'],
  },
  {
    id: 'rSchwartz',
    fullName: 'Ryan Schwartz',
    firstName: 'Ryan',
    lastName: 'Schwartz',
    avatar: ryanAvatar,
    leagues: ['lp'],
  },
  {
    id: 'gNadra',
    fullName: 'Gabriel Nadra',
    firstName: 'Gabriel',
    lastName: 'Nadra',
    avatar: gabeAvatar,
    leagues: ['lp'],
  },
  {
    id: 'iOHandley',
    fullName: "Ian O'Handley",
    firstName: 'Ian',
    lastName: "O'Handley",
    avatar: ianAvatar,
    leagues: ['lp'],
  },
  {
    id: 'wDavison',
    fullName: 'William Davison',
    firstName: 'William',
    lastName: 'Davison',
    avatar: willAvatar,
    leagues: ['lp'],
  },
  {
    id: 'dBrown',
    fullName: 'Declan Brown',
    firstName: 'Declan',
    lastName: 'Brown',
    avatar: undefined,
    leagues: ['lp'],
  },
];

// =============================================================================
// LOOKUP MAPS (built at module load time for O(1) lookups)
// =============================================================================

// Map: managerId -> Manager
const managerById = new Map<string, Manager>(
  managers.map((m) => [m.id.toLowerCase(), m])
);

// Map: fullName (lowercase) -> Manager
const managerByFullName = new Map<string, Manager>(
  managers.map((m) => [m.fullName.toLowerCase(), m])
);

// Map: firstName (lowercase) -> Manager[] (multiple managers can share first name)
const managersByFirstName = new Map<string, Manager[]>();
for (const m of managers) {
  const key = m.firstName.toLowerCase();
  const list = managersByFirstName.get(key) || [];
  list.push(m);
  managersByFirstName.set(key, list);
}

// =============================================================================
// LOOKUP FUNCTIONS
// =============================================================================

/**
 * Get a manager by their unique ID
 */
export function getManagerById(id: string): Manager | undefined {
  return managerById.get(id.toLowerCase());
}

/**
 * Get a manager by their full display name
 */
export function getManagerByFullName(fullName: string): Manager | undefined {
  return managerByFullName.get(fullName.toLowerCase());
}

/**
 * Get all managers with a given first name
 */
export function getManagersByFirstName(firstName: string): Manager[] {
  return managersByFirstName.get(firstName.toLowerCase()) || [];
}

/**
 * Get the avatar for a manager by name (supports both full name and ID)
 */
export function getManagerAvatar(nameOrId: string): string | undefined {
  const lower = nameOrId.toLowerCase();

  // Try by ID first
  const byId = managerById.get(lower);
  if (byId) return byId.avatar;

  // Try by full name
  const byName = managerByFullName.get(lower);
  if (byName) return byName.avatar;

  return undefined;
}

/**
 * Get all managers for a specific league
 */
export function getManagersByLeague(leagueId: LeagueId): Manager[] {
  return managers.filter((m) => m.leagues.includes(leagueId));
}

/**
 * Resolve a name to a manager, given the league context
 * This handles cases where a first name matches multiple managers
 */
export function resolveManager(
  name: string,
  leagueId?: LeagueId
): Manager | undefined {
  const lower = name.toLowerCase();
  if (lower === 'gobol') {
    return managerByFullName.get('andrew klein');
  }

  // Try exact full name match first
  const byFullName = managerByFullName.get(lower);
  if (byFullName) return byFullName;

  // Try by ID
  const byId = managerById.get(lower);
  if (byId) return byId;

  // Try first name match (with league context to disambiguate)
  const byFirstName = managersByFirstName.get(lower);
  if (byFirstName && byFirstName.length > 0) {
    if (leagueId) {
      // Filter by league
      const inLeague = byFirstName.filter((m) => m.leagues.includes(leagueId));
      if (inLeague.length === 1) return inLeague[0];
    }
    // If only one match or no league context, return first
    if (byFirstName.length === 1) return byFirstName[0];
  }

  return undefined;
}

/**
 * Check if a manager has an avatar
 */
export function hasManagerAvatar(nameOrId: string): boolean {
  return getManagerAvatar(nameOrId) !== undefined;
}

export function slugifyManagerName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

export function getManagerId(name: string, leagueId?: LeagueId): string {
  const manager = resolveManager(name, leagueId);
  return (manager?.id || slugifyManagerName(name)).toLowerCase();
}

export function getManagerProfilePath(
  leagueId: LeagueId,
  name: string
): string {
  return `/${leagueId}/managers/${getManagerId(name, leagueId)}`;
}

export function getManagerByIdOrName(
  idOrName: string,
  leagueId?: LeagueId
): Manager | undefined {
  return getManagerById(idOrName) || resolveManager(idOrName, leagueId);
}
