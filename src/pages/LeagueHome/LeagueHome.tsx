import { useParams, Navigate } from 'react-router-dom';
import { getLeagueInfo, getLatestSeasonData, isValidLeague } from '../../data';
import styles from './LeagueHome.module.scss';

export function LeagueHome() {
  const { leagueId } = useParams<{ leagueId: string }>();

  // Validate league ID
  if (!leagueId || !isValidLeague(leagueId)) {
    return <Navigate to="/" replace />;
  }

  const leagueInfo = getLeagueInfo(leagueId);
  const latestSeason = getLatestSeasonData(leagueId);

  if (!leagueInfo) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={styles.leagueHome}>
      <header className={styles.header}>
        <h1>{leagueInfo.name}</h1>
        {leagueInfo.description && <p>{leagueInfo.description}</p>}
      </header>

      {latestSeason ? (
        <section className={styles.latestSeason}>
          <h2>{latestSeason.year} Season</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>
                {latestSeason.teams.length}
              </span>
              <span className={styles.statLabel}>Teams</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>
                {latestSeason.matchups.filter((m) => m.isComplete).length}
              </span>
              <span className={styles.statLabel}>Games Played</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>
                {latestSeason.draft.length}
              </span>
              <span className={styles.statLabel}>Draft Picks</span>
            </div>
          </div>
        </section>
      ) : (
        <section className={styles.noData}>
          <p>No season data available yet.</p>
        </section>
      )}
    </div>
  );
}
