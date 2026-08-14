import { Navigate, useParams } from 'react-router-dom';
import { getPlayoffHistory, isValidLeague } from '../../data';
import { ManagerBadge } from '../../components/ManagerBadge/ManagerBadge';
import styles from './Champions.module.scss';

export function Champions() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const validLeagueId = leagueId && isValidLeague(leagueId) ? leagueId : null;
  const history = validLeagueId ? getPlayoffHistory(validLeagueId) : null;

  if (!validLeagueId) {
    return <Navigate to="/" replace />;
  }

  const champions = [...(history?.history ?? [])].sort(
    (a, b) => b.year - a.year
  );

  return (
    <div className={styles.champions}>
      <header className={styles.header}>
        <h1>Champions</h1>
        <p>Every title winner in league history.</p>
      </header>

      {champions.length === 0 ? (
        <p className={styles.empty}>No champions recorded yet.</p>
      ) : (
        <ul className={styles.list}>
          {champions.map((entry) => (
            <li key={entry.year} className={styles.row}>
              <span className={styles.year}>{entry.year}</span>
              <ManagerBadge
                name={entry.champion}
                size="lg"
                leagueId={validLeagueId}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
