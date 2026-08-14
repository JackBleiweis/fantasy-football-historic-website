import type { DraftDayTrade, DraftDayTradePick } from '../types';

export function formatSnakePick(overall: number, teamCount: number): string {
  if (!teamCount) return String(overall);
  const round = Math.ceil(overall / teamCount);
  const pos = ((overall - 1) % teamCount) + 1;
  return `${round}.${String(pos).padStart(2, '0')}`;
}

export function draftedPlayerName(pick: DraftDayTradePick): string {
  return `${pick.playerFirstName} ${pick.playerLastName}`.trim();
}

export function tradePickNumbers(trade: DraftDayTrade): number[] {
  return [
    ...new Set(
      trade.sides.flatMap((side) => side.sent.map((pick) => pick.pick))
    ),
  ];
}

/**
 * If this sender already received the pick in an earlier draft-day trade,
 * return that manager's name (e.g. Ben sending 9.05 after getting it from Michael).
 */
export function acquiredFromManager(
  pick: DraftDayTradePick,
  senderTeamId: string,
  trades: DraftDayTrade[],
  currentTradeId: string
): string | null {
  for (const trade of trades) {
    if (trade.id === currentTradeId) continue;
    const senderSide = trade.sides.find((side) => side.teamId === senderTeamId);
    if (!senderSide?.received.some((received) => received.pick === pick.pick)) {
      continue;
    }
    const other = trade.sides.find((side) => side.teamId !== senderTeamId);
    return other?.manager ?? null;
  }
  return null;
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName;
}
