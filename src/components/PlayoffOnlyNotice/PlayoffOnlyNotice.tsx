import { getPlayoffYear } from '../../data';
import { ManagerBadge } from '../ManagerBadge/ManagerBadge';
import type { LeagueId } from '../../types';
import styles from './PlayoffOnlyNotice.module.scss';

interface PlayoffOnlyNoticeProps {
  leagueId: LeagueId;
  year: number;
}

export function PlayoffOnlyNotice({ leagueId, year }: PlayoffOnlyNoticeProps) {
  const playoff = getPlayoffYear(leagueId, year);

  if (!playoff) {
    return (
      <div className={styles.notice}>
        <h2>{year}</h2>
        <p>No season data available for this year.</p>
      </div>
    );
  }

  return (
    <div className={styles.notice}>
      <h2>{year} Playoffs</h2>
      <p>
        We don&apos;t have drafts, standings, or matchups for {year} yet. All we
        know is how the playoffs finished.
      </p>
      <div className={styles.results}>
        <div className={styles.resultCard}>
          <span className={styles.label}>Champion</span>
          <ManagerBadge name={playoff.champion} leagueId={leagueId} />
        </div>
        <div className={styles.resultCard}>
          <span className={styles.label}>Runner-up</span>
          <ManagerBadge name={playoff.runnerUp} leagueId={leagueId} />
        </div>
        {playoff.playoffTeams.length > 0 && (
          <div className={styles.resultCard}>
            <span className={styles.label}>Also in the playoffs</span>
            <div className={styles.teamList}>
              {playoff.playoffTeams.map((name) => (
                <ManagerBadge key={name} name={name} leagueId={leagueId} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
