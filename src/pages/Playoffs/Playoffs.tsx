import { useMemo } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import {
  getDisplayYears,
  getPlayoffHistory,
  getPlayoffYear,
  isValidLeague,
} from '../../data';
import { ManagerBadge } from '../../components/ManagerBadge/ManagerBadge';
import { YearSelector } from '../../components/YearSelector/YearSelector';
import styles from './Playoffs.module.scss';

export function Playoffs() {
  const { leagueId, year } = useParams<{ leagueId: string; year?: string }>();
  const validLeagueId = leagueId && isValidLeague(leagueId) ? leagueId : null;
  const history = validLeagueId ? getPlayoffHistory(validLeagueId) : null;
  const years = useMemo(
    () =>
      (history?.history.map((h) => h.year) ?? []).sort((a, b) => b - a),
    [history]
  );
  const selectedYear = year ? parseInt(year, 10) : years[0];
  const playoffYear =
    validLeagueId && selectedYear
      ? getPlayoffYear(validLeagueId, selectedYear)
      : null;

  if (!validLeagueId) {
    return <Navigate to="/" replace />;
  }

  if (!playoffYear) {
    return (
      <div className={styles.playoffs}>
        <h1>Playoffs</h1>
        <p className={styles.empty}>No playoff history yet.</p>
      </div>
    );
  }

  const allPlayoffTeams = [
    playoffYear.champion,
    playoffYear.runnerUp,
    ...playoffYear.playoffTeams,
  ];

  return (
    <div className={styles.playoffs}>
      <header className={styles.header}>
        <h1>{selectedYear} Playoffs</h1>
        <YearSelector
          years={years}
          selectedYear={selectedYear}
          hrefForYear={(y) => `/${validLeagueId}/playoffs/${y}`}
        />
      </header>

      <div className={styles.finals}>
        <article className={`${styles.card} ${styles.champion}`}>
          <span className={styles.medal}>🥇</span>
          <span className={styles.role}>Champion</span>
          <ManagerBadge name={playoffYear.champion} size="lg" leagueId={validLeagueId} />
        </article>
        <article className={`${styles.card} ${styles.runnerUp}`}>
          <span className={styles.medal}>🥈</span>
          <span className={styles.role}>Runner-up</span>
          <ManagerBadge name={playoffYear.runnerUp} size="lg" leagueId={validLeagueId} />
        </article>
      </div>

      {playoffYear.playoffTeams.length > 0 && (
        <section className={styles.field}>
          <h2>Playoff field</h2>
          <div className={styles.fieldGrid}>
            {allPlayoffTeams.map((name, index) => (
              <div key={name} className={styles.fieldCard}>
                <span className={styles.seed}>
                  {index === 0 ? '🏆' : index === 1 ? '🥈' : `#${index + 1}`}
                </span>
                <ManagerBadge name={name} leagueId={validLeagueId} />
              </div>
            ))}
          </div>
        </section>
      )}

      <p className={styles.note}>
        Playoff results are tracked separately from Yahoo standings.{' '}
        <Link to={`/${validLeagueId}/standings/${selectedYear}`}>
          View {getDisplayYears(validLeagueId).includes(selectedYear) ? 'standings' : 'league home'}
        </Link>
      </p>
    </div>
  );
}
