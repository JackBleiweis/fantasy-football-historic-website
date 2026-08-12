export interface ActivityRating {
  score: number;
  label: string;
  blurb: string;
  totalMoves: number;
  totalTrades: number;
  seasonsTracked: number;
}

const TIERS: { min: number; label: string; blurb: string }[] = [
  { min: 85, label: 'Waiver Warlord', blurb: 'Sleeps with the waiver wire under the pillow.' },
  { min: 70, label: 'Manager Mongol', blurb: 'Conquers the wire, then asks what else is left.' },
  { min: 50, label: 'Roster Tinkerer', blurb: 'Always one more tweak away from glory.' },
  { min: 30, label: 'Casual Clicker', blurb: 'Checks the app, makes a move, goes back to real life.' },
  { min: 15, label: 'Quiet Mouse', blurb: 'Sets the lineup and disappears until December.' },
  { min: 0, label: 'Hibernating Hamster', blurb: 'The auto-draft did most of the work.' },
];

export function getActivityRating(
  totalMoves: number,
  totalTrades: number,
  seasonsTracked: number
): ActivityRating | null {
  if (seasonsTracked <= 0) return null;

  const perSeason = (totalMoves + totalTrades * 4) / seasonsTracked;
  const score = Math.max(0, Math.min(100, Math.round((perSeason / 55) * 100)));
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
