import type { LeagueId, WeeklyRosters } from '../types';

const rosterModules = import.meta.glob<{ default: WeeklyRosters }>(
  './*/*-rosters.json'
);

export async function loadWeeklyRosters(
  leagueId: LeagueId,
  year: number
): Promise<WeeklyRosters | null> {
  const key = `./${leagueId}/${year}-rosters.json`;
  const loader = rosterModules[key];
  if (!loader) return null;

  try {
    const mod = await loader();
    return mod.default;
  } catch {
    return null;
  }
}
