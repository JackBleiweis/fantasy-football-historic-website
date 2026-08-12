import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  getAvailableYears,
  getPlayoffYear,
  isValidLeague,
} from '../../data';
import {
  getManagerById,
  getManagerId,
  getManagerAvatar,
  resolveManager,
} from '../../data/managers';
import { useManagerStats } from '../../hooks/useManagerStats';
import { getHeadToHeadRecords, type HeadToHeadRecord } from '../../utils/headToHead';
import { getActivityRating } from '../../utils/activity';
import { getSeasonData } from '../../data';
import { ManagerBadge } from '../../components/ManagerBadge/ManagerBadge';
import { H2HMatchupsModal } from '../../components/H2HMatchupsModal/H2HMatchupsModal';
import type { LeagueId } from '../../types';
import styles from './ManagerProfile.module.scss';

function findManagerName(param: string, leagueId: LeagueId): string | null {
  const byId = getManagerById(param);
  if (byId) return byId.fullName;

  const byName = resolveManager(param, leagueId);
  if (byName) return byName.fullName;

  const years = getAvailableYears(leagueId);
  for (const year of years) {
    const season = getSeasonData(leagueId, year);
    const match = season?.teams.find(
      (t) => getManagerId(t.manager, leagueId) === param.toLowerCase()
    );
    if (match) return match.manager;
  }

  return null;
}

function formatH2HRecord(row: HeadToHeadRecord) {
  return row.ties > 0
    ? `${row.wins}-${row.losses}-${row.ties}`
    : `${row.wins}-${row.losses}`;
}

function HeadToHeadList({
  rows,
  leagueId,
  showPoints,
  onViewMatchups,
}: {
  rows: HeadToHeadRecord[];
  leagueId: LeagueId;
  showPoints?: boolean;
  onViewMatchups: (name: string) => void;
}) {
  return (
    <div className={styles.h2hList}>
      {rows.map((row) => (
        <div key={row.opponent} className={styles.h2hCard}>
          <div className={styles.h2hMain}>
            <ManagerBadge
              name={row.opponent}
              size="sm"
              leagueId={leagueId}
            />
            <span className={styles.h2hRecord}>{formatH2HRecord(row)}</span>
          </div>
          {showPoints && (
            <div className={styles.h2hPoints}>
              <span>PF {row.pointsFor.toFixed(1)}</span>
              <span>PA {row.pointsAgainst.toFixed(1)}</span>
            </div>
          )}
          <button
            type="button"
            className={styles.viewMatchups}
            onClick={() => onViewMatchups(row.opponent)}
          >
            View past matchups
          </button>
        </div>
      ))}
    </div>
  );
}

export function ManagerProfile() {
  const { leagueId, managerId } = useParams<{
    leagueId: string;
    managerId: string;
  }>();
  const validLeagueId = leagueId && isValidLeague(leagueId) ? leagueId : null;
  const managerName =
    validLeagueId && managerId
      ? findManagerName(managerId, validLeagueId)
      : null;

  const stats = useManagerStats(managerName || '', validLeagueId || 'cwp');
  const [h2hOpponent, setH2hOpponent] = useState<string | null>(null);
  const regularH2H = useMemo(
    () =>
      managerName && validLeagueId
        ? getHeadToHeadRecords(managerName, validLeagueId)
        : [],
    [managerName, validLeagueId]
  );
  const playoffH2H = useMemo(
    () =>
      managerName && validLeagueId
        ? getHeadToHeadRecords(managerName, validLeagueId, {
            playoffsOnly: true,
          })
        : [],
    [managerName, validLeagueId]
  );

  const activity = useMemo(() => {
    if (!managerName || !validLeagueId) return null;
    let moves = 0;
    let trades = 0;
    let seasonsTracked = 0;
    for (const year of getAvailableYears(validLeagueId)) {
      const season = getSeasonData(validLeagueId, year);
      const team = season?.teams.find(
        (t) => t.manager.toLowerCase() === managerName.toLowerCase()
      );
      if (!team) continue;
      if (team.moves != null || team.tradesCount != null) {
        moves += team.moves || 0;
        trades += team.tradesCount || 0;
        seasonsTracked += 1;
      }
    }
    return getActivityRating(moves, trades, seasonsTracked);
  }, [managerName, validLeagueId]);

  if (!validLeagueId) return <Navigate to="/" replace />;
  if (!managerName || !stats) {
    return (
      <div className={styles.profile}>
        <h1>Manager not found</h1>
        <Link to={`/${validLeagueId}`}>Back to league</Link>
      </div>
    );
  }

  const avatarUrl = getManagerAvatar(managerName);
  const playoffOnlySeasons = [];
  // Include playoff-only years that this manager appeared in
  const extraYears = [2012, 2013].filter(
    (year) => !stats.seasons.some((s) => s.year === year)
  );
  for (const year of extraYears) {
    const playoff = getPlayoffYear(validLeagueId, year);
    if (!playoff) continue;
    const lower = managerName.toLowerCase();
    const involved =
      playoff.champion.toLowerCase() === lower ||
      playoff.runnerUp.toLowerCase() === lower ||
      playoff.playoffTeams.some((t) => t.toLowerCase() === lower);
    if (involved) playoffOnlySeasons.push({ year, playoff });
  }

  return (
    <div className={styles.profile}>
      <Link to={`/${validLeagueId}/managers`} className={styles.backLink}>
        ← All managers
      </Link>
      <header className={styles.header}>
        <div className={styles.avatar}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={managerName} />
          ) : (
            <span>{managerName.charAt(0)}</span>
          )}
        </div>
        <div>
          <h1>{managerName}</h1>
          <p>
            {stats.seasons.length} season{stats.seasons.length === 1 ? '' : 's'}
            {stats.championshipsWon > 0 &&
              ` • ${'🏆'.repeat(stats.championshipsWon)}`}
          </p>
        </div>
      </header>

      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.label}>Record</span>
          <span className={styles.value}>
            {stats.totalWins}-{stats.totalLosses}
            {stats.totalTies > 0 ? `-${stats.totalTies}` : ''}
          </span>
          <span className={styles.meta}>
            {(stats.winPercentage * 100).toFixed(1)}% win rate
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.label}>Avg PF</span>
          <span className={styles.value}>
            {stats.averagePointsPerWeek.toFixed(1)}
          </span>
          <span className={styles.meta}>points per week</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.label}>High score</span>
          <span className={styles.value}>
            {stats.highestSingleGameScore.toFixed(1)}
          </span>
          {stats.highestGameDetails && (
            <span className={styles.meta}>
              {stats.highestGameDetails.year} Wk {stats.highestGameDetails.week} vs{' '}
              {stats.highestGameDetails.opponent}
            </span>
          )}
        </div>
        <div className={styles.statCard}>
          <span className={styles.label}>Titles</span>
          <span className={styles.value}>{stats.championshipsWon}</span>
          <span className={styles.meta}>
            {stats.finalsAppearances} finals • {stats.playoffAppearances} playoffs
          </span>
        </div>
        {activity && (
          <div className={`${styles.statCard} ${styles.activity}`}>
            <span className={styles.label}>Activity</span>
            <span className={styles.value}>{activity.score}</span>
            <span className={styles.meta}>
              {activity.label} • {activity.totalMoves} moves • {activity.totalTrades} trades
            </span>
            <span className={styles.blurb}>{activity.blurb}</span>
          </div>
        )}
      </section>

      <section>
        <h2>Seasons</h2>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Year</th>
                <th>Team</th>
                <th>Record</th>
                <th>Rank</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {playoffOnlySeasons.map(({ year, playoff }) => (
                <tr key={year}>
                  <td>{year}</td>
                  <td colSpan={3} className={styles.muted}>
                    Playoff result only
                  </td>
                  <td>
                    {playoff.champion.toLowerCase() === managerName.toLowerCase()
                      ? '🏆 Champion'
                      : playoff.runnerUp.toLowerCase() === managerName.toLowerCase()
                        ? '2nd Place'
                        : 'Playoffs'}
                  </td>
                </tr>
              ))}
              {stats.seasons.map((season) => (
                <tr key={season.year}>
                  <td>
                    <Link to={`/${validLeagueId}/standings/${season.year}`}>
                      {season.year}
                    </Link>
                  </td>
                  <td>{season.teamName}</td>
                  <td>
                    {season.wins}-{season.losses}
                    {season.ties > 0 ? `-${season.ties}` : ''}
                  </td>
                  <td>#{season.rank}</td>
                  <td>
                    {season.isChampion
                      ? '🏆 Champion'
                      : season.isRunnerUp
                        ? '2nd Place'
                        : season.madePlayoffs
                          ? 'Playoffs'
                          : 'Missed'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>Head-to-head</h2>
        <p className={styles.muted}>Regular season only.</p>
        <HeadToHeadList
          rows={regularH2H}
          leagueId={validLeagueId}
          showPoints
          onViewMatchups={setH2hOpponent}
        />
      </section>

      {playoffH2H.length > 0 && (
        <section>
          <h2>Playoff head-to-head</h2>
          <p className={styles.muted}>
            From Yahoo playoff flags. Treat this as unofficial until the playoff
            audit is done.
          </p>
          <HeadToHeadList
            rows={playoffH2H}
            leagueId={validLeagueId}
            onViewMatchups={setH2hOpponent}
          />
        </section>
      )}
      {h2hOpponent && (
        <H2HMatchupsModal
          isOpen
          onClose={() => setH2hOpponent(null)}
          leagueId={validLeagueId}
          managerName={managerName}
          opponentName={h2hOpponent}
        />
      )}
    </div>
  );
}
