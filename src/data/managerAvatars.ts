/**
 * Manager avatar mappings
 * Maps manager names (case-insensitive) to their avatar image paths
 *
 * IMPORTANT: Use full names to distinguish managers with the same first name
 * (e.g., "Jack Bleiweis" vs "Jack Beder")
 */

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

/**
 * Map of manager names (lowercase) to their avatar URLs
 * Use full names for uniqueness
 */
const managerAvatarMap: Record<string, string> = {
  // CWP League managers (use full names to match transformed data)
  'jack bleiweis': bleiweisAvatar,
  'jack beder': bederAvatar,
  'dustin pulver': dustinAvatar,
  'michael kagan': michaelAvatar,
  'ty greenberg': tyAvatar,
  'ben roher': benAvatar,
  'jake mintz': jakeAvatar,
  'buddy marcello': buddyAvatar,
  'chase bergman': chaseAvatar,
  'matthew garay': matthewCwpAvatar,

  // LP League managers (using first names - except Matthew who needs full name)
  james: jamesAvatar,
  'matthew weintraub': matthewLpAvatar,
  joe: joeAvatar,
  harrison: harryAvatar,
  lucas: lucasAvatar,
  heri: heriAvatar,
  kevin: kevinAvatar,
  ryan: ryanAvatar,
  gabriel: gabeAvatar,
  ian: ianAvatar,
  william: willAvatar,
};

/**
 * Get the avatar URL for a manager by name
 * Returns undefined if no avatar is set for this manager
 */
export function getManagerAvatar(managerName: string): string | undefined {
  return managerAvatarMap[managerName.toLowerCase()];
}

/**
 * Check if a manager has an avatar
 */
export function hasManagerAvatar(managerName: string): boolean {
  return managerName.toLowerCase() in managerAvatarMap;
}
