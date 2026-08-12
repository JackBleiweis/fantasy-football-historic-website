export function hashSeed(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getDailySeed(extra = ''): string {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}-${extra}`;
}

export function pickDailyIndex(length: number, extra = ''): number {
  if (length <= 0) return 0;
  return hashSeed(getDailySeed(extra)) % length;
}
