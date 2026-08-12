# League data quirks

## CWP: two-week championship finals (2021–present)

### What happened
CWP switched the championship to a **two-week final**. Yahoo still exposes a
single championship matchup row (typically **week 17**) whose `points` are the
**sum of both final weeks**, not one NFL week.

Semis stay single-week (week 15). The first half of the final often appears as
each finalist's week-16 score (sometimes against a placeholder / other bracket
opponent). Week 17's matchup total is week-16 starters + week-17 starters.

Example (2023, Jack Beder / "Ty Reeks"):
- Week 16 starters ≈ 135.66
- Week 17 starters ≈ 163.46
- Yahoo championship matchup = **299.12** (sum)

That inflated "highest score" / "highest week" on manager profiles and records
until we corrected it in the transform.

### What we do in code
`scripts/transformData.js` keeps a config list:

```js
MULTI_WEEK_CHAMPIONSHIP_FINALS = {
  cwp: {
    2021: { week: 17 },
    2022: { week: 17 },
    // ...
  },
}
```

For those seasons, the transform:
1. Finds the playoff non-consolation matchup in that week (the combined final)
2. Sets `isMultiWeekFinal: true`
3. Replaces matchup points with **that week's roster starter totals** so the
   row is a normal single-week score again

Champion / runner-up still come from `playoffs.json` (source of truth for
titles), not from re-scoring the combined Yahoo total.

### If the league changes again
- Add or remove years in `MULTI_WEEK_CHAMPIONSHIP_FINALS`
- Re-run `node scripts/transformData.js`
- If Yahoo starts exporting true per-week final matchups, remove the year from
  the config so we stop rewriting points
