export interface ActivityRating {
  score: number;
  label: string;
  blurb: string;
  totalMoves: number;
  totalTrades: number;
  seasonsTracked: number;
}

/**
 * Score is weighted actions per season (moves + 4×trades), capped at 100.
 * Waiver Warlord is meant for the handful of managers who live on the wire,
 * not a typical 40-move season.
 */
const TIERS: { min: number; label: string; blurb: string }[] = [
  {
    min: 80,
    label: 'Waiver Warlord',
    blurb: 'Sleeps with the waiver wire under the pillow.',
  },
  {
    min: 60,
    label: 'Manager Mongol',
    blurb: 'Conquers the wire, then asks what else is left.',
  },
  {
    min: 40,
    label: 'Roster Tinkerer',
    blurb: 'Always one more tweak away from glory.',
  },
  {
    min: 25,
    label: 'Casual Clicker',
    blurb: 'Checks the app, makes a move, goes back to real life.',
  },
  {
    min: 12,
    label: 'Quiet Mouse',
    blurb: 'Sets the lineup and disappears until December.',
  },
  {
    min: 0,
    label: 'Hibernating Hamster',
    blurb: 'The auto-draft did most of the work.',
  },
];

const WARLORD_PACE = 100;

export function getActivityRating(
  totalMoves: number,
  totalTrades: number,
  seasonsTracked: number
): ActivityRating | null {
  if (seasonsTracked <= 0) return null;

  const perSeason = (totalMoves + totalTrades * 4) / seasonsTracked;
  const score = Math.max(
    0,
    Math.min(100, Math.round((perSeason / WARLORD_PACE) * 100))
  );
  const tier = TIERS.find((t) => score >= t.min) || TIERS[TIERS.length - 1];

  return {
    score,
    label: tier.label,
    blurb: tier.blurb,
    totalMoves,
    totalTrades,
    seasonsTracked,
  };
}
