import { Link, Navigate, useParams } from 'react-router-dom';
import { isValidLeague } from '../../data';
import { getLeagueManagerSummaries } from '../../utils/managerSummaries';
import styles from './Managers.module.scss';

function formatRecord(wins: number, losses: number, ties: number): string {
  if (wins === 0 && losses === 0 && ties === 0) return '—';
  return ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;
}

export function Managers() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const validLeagueId = leagueId && isValidLeague(leagueId) ? leagueId : null;

  if (!validLeagueId) {
    return <Navigate to="/" replace />;
  }

  const managers = getLeagueManagerSummaries(validLeagueId);

  return (
    <div className={styles.managers}>
      <header className={styles.header}>
        <h1>Managers</h1>
        <p>Open a full profile for career stats, seasons, and head-to-head.</p>
      </header>

      {managers.length === 0 ? (
        <p className={styles.noData}>No managers found.</p>
      ) : (
        <div className={styles.grid}>
          {managers.map((manager) => (
            <Link
              key={manager.id}
              to={`/${validLeagueId}/managers/${manager.id}`}
              className={styles.card}
            >
              <div className={styles.avatar}>
                {manager.avatar ? (
                  <img src={manager.avatar} alt="" />
                ) : (
                  <span>{manager.name.charAt(0)}</span>
                )}
              </div>
              <div className={styles.info}>
                <h2>{manager.name}</h2>
                <p>
                  {manager.championships > 0
                    ? `${'🏆'.repeat(manager.championships)} • `
                    : ''}
                  {formatRecord(manager.wins, manager.losses, manager.ties)}
                  {manager.seasons > 0
                    ? ` • ${manager.seasons} season${manager.seasons === 1 ? '' : 's'}`
                    : ' • Playoffs only'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
