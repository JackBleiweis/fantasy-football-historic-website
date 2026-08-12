import { useMemo, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import {
  getSeasonData,
  getDisplayYears,
  isValidLeague,
  isPlayoffOnlyYear,
} from '../../data';
import { createTeamLookup } from '../../utils/teamUtils';
import { ManagerBadge } from '../../components/ManagerBadge/ManagerBadge';
import { YearSelector } from '../../components/YearSelector/YearSelector';
import { PlayoffOnlyNotice } from '../../components/PlayoffOnlyNotice/PlayoffOnlyNotice';
import styles from './Drafts.module.scss';

type DraftView = 'board' | 'team';

export function Drafts() {
  const { leagueId, year } = useParams<{ leagueId: string; year?: string }>();
  const [view, setView] = useState<DraftView>('board');

  const validLeagueId = leagueId && isValidLeague(leagueId) ? leagueId : null;
  const displayYears = validLeagueId ? getDisplayYears(validLeagueId) : [];
  const selectedYear = year ? parseInt(year, 10) : displayYears[0];
  const seasonData =
    validLeagueId && selectedYear
      ? getSeasonData(validLeagueId, selectedYear)
      : null;
  const playoffOnly =
    validLeagueId && selectedYear
      ? isPlayoffOnlyYear(validLeagueId, selectedYear)
      : false;

  const teamLookup = useMemo(
    () => (seasonData ? createTeamLookup(seasonData.teams) : new Map()),
    [seasonData]
  );

  const picksByTeam = useMemo(() => {
    if (!seasonData) return [];
    const grouped = new Map<string, typeof seasonData.draft>();
    for (const pick of seasonData.draft) {
      const list = grouped.get(pick.teamId) || [];
      list.push(pick);
      grouped.set(pick.teamId, list);
    }
    return seasonData.teams
      .slice()
      .sort((a, b) => a.rank - b.rank)
      .map((team) => ({
        team,
        picks: (grouped.get(team.id) || []).sort((a, b) => a.round - b.round),
      }));
  }, [seasonData]);

  if (!validLeagueId) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={styles.drafts}>
      <header className={styles.header}>
        <h1>{selectedYear} Draft</h1>
        <YearSelector
          years={displayYears}
          selectedYear={selectedYear}
          hrefForYear={(y) => `/${validLeagueId}/drafts/${y}`}
        />
      </header>

      {playoffOnly && (
        <PlayoffOnlyNotice leagueId={validLeagueId} year={selectedYear} />
      )}

      {!playoffOnly && !seasonData && (
        <p className={styles.noData}>No draft data available.</p>
      )}

      {seasonData && (
        <>
          <div className={styles.viewToggle}>
            <button
              className={view === 'board' ? styles.active : ''}
              onClick={() => setView('board')}
            >
              By pick
            </button>
            <button
              className={view === 'team' ? styles.active : ''}
              onClick={() => setView('team')}
            >
              By team
            </button>
          </div>

          {view === 'board' ? (
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
                                leagueId={validLeagueId}
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
          ) : (
            <div className={styles.teamDrafts}>
              {picksByTeam.map(({ team, picks }) => (
                <section key={team.id} className={styles.teamCard}>
                  <header>
                    <ManagerBadge name={team.manager} leagueId={validLeagueId} />
                    <span className={styles.teamName}>{team.name}</span>
                  </header>
                  <ol>
                    {picks.map((pick) => (
                      <li key={pick.pick}>
                        <span className={styles.round}>R{pick.round}</span>
                        <span>
                          {pick.playerFirstName} {pick.playerLastName}
                        </span>
                        <span className={styles.overall}>#{pick.pick}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
