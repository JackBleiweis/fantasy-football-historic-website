import { useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { getSeasonData, getAvailableYears, isValidLeague } from '../../data';
import { createTeamLookup } from '../../utils/teamUtils';
import { ManagerBadge } from '../../components/ManagerBadge/ManagerBadge';
import styles from './Drafts.module.scss';

export function Drafts() {
  const { leagueId, year } = useParams<{ leagueId: string; year?: string }>();

  // Validate league ID
  if (!leagueId || !isValidLeague(leagueId)) {
    return <Navigate to="/" replace />;
  }

  const availableYears = getAvailableYears(leagueId);
  const selectedYear = year ? parseInt(year, 10) : availableYears[0];
  const seasonData = selectedYear
    ? getSeasonData(leagueId, selectedYear)
    : null;

  // Create a lookup map for team ID -> team data (including manager)
  const teamLookup = useMemo(
    () => (seasonData ? createTeamLookup(seasonData.teams) : new Map()),
    [seasonData]
  );

  if (!seasonData) {
    return (
      <div className={styles.drafts}>
        <h1>Drafts</h1>
        <p className={styles.noData}>No draft data available.</p>
      </div>
    );
  }

  return (
    <div className={styles.drafts}>
      <header className={styles.header}>
        <h1>{selectedYear} Draft</h1>
        {availableYears.length > 1 && (
          <div className={styles.yearSelector}>
            {availableYears.map((y) => (
              <a
                key={y}
                href={`/${leagueId}/drafts/${y}`}
                className={y === selectedYear ? styles.active : ''}
              >
                {y}
              </a>
            ))}
          </div>
        )}
      </header>

      <div className={styles.draftBoard}>
        <div className={styles.tableWrapper}>
          <table className={styles.draftTable}>
            <thead>
              <tr>
                <th>Pick</th>
                <th>Round</th>
                <th>Manager</th>
                <th>Team</th>
                <th>Player</th>
                <th>ADP</th>
              </tr>
            </thead>
            <tbody>
              {seasonData.draft.map((pick) => {
                const team = teamLookup.get(pick.teamId);
                return (
                  <tr key={pick.pick}>
                    <td className={styles.pickNumber}>{pick.pick}</td>
                    <td>{pick.round}</td>
                    <td className={styles.manager}>
                      {team?.manager ? (
                        <ManagerBadge
                          name={team.manager}
                          size="sm"
                          leagueId={leagueId}
                        />
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className={styles.teamName}>{pick.teamName}</td>
                    <td className={styles.playerName}>
                      {pick.playerFirstName} {pick.playerLastName}
                    </td>
                    <td className={styles.adp}>
                      {pick.avgPick ? pick.avgPick.toFixed(1) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
