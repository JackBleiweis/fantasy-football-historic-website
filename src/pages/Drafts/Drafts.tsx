import { Fragment, useEffect, useMemo, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import {
  getSeasonData,
  getDisplayYears,
  isValidLeague,
  isPlayoffOnlyYear,
  getDraftDayTrades,
  getDraftDayUnresolved,
} from '../../data';
import { createTeamLookup } from '../../utils/teamUtils';
import {
  acquiredFromManager,
  draftedPlayerName,
  firstName,
  formatSnakePick,
  tradePickNumbers,
} from '../../utils/draftDayTrades';
import { ManagerBadge } from '../../components/ManagerBadge/ManagerBadge';
import { YearSelector } from '../../components/YearSelector/YearSelector';
import { PlayoffOnlyNotice } from '../../components/PlayoffOnlyNotice/PlayoffOnlyNotice';
import type {
  DraftDayTrade,
  DraftDayTradePick,
  DraftDayUnresolved,
  LeagueId,
} from '../../types';
import styles from './Drafts.module.scss';

type DraftView = 'board' | 'team';

function PickChip({
  pick,
  fromManager,
}: {
  pick: DraftDayTradePick;
  fromManager: string | null;
}) {
  return (
    <li className={styles.pickChip}>
      <span className={styles.pickNum}>{pick.label}</span>
      {fromManager && (
        <span className={styles.fromLabel}>from {firstName(fromManager)}</span>
      )}
      <span className={styles.becameLabel}>became</span>
      <span className={styles.becamePlayer}>{draftedPlayerName(pick)}</span>
    </li>
  );
}

function DraftDayTradesSection({
  leagueId,
  trades,
  unresolved,
  selectedTradeId,
  onSelectTrade,
}: {
  leagueId: LeagueId;
  trades: DraftDayTrade[];
  unresolved: DraftDayUnresolved[];
  selectedTradeId: string | null;
  onSelectTrade: (id: string | null) => void;
}) {
  if (trades.length === 0 && unresolved.length === 0) return null;

  return (
    <section className={styles.draftDayTrades}>
      <header>
        <h2>Draft-day trades</h2>
        <p>
          These picks were swapped before they were made. Each name is who that
          pick became, not a player who was traded. Select a trade to see those
          picks on the board.
        </p>
      </header>

      <ul className={styles.tradeList}>
        {trades.map((trade) => {
          const selected = trade.id === selectedTradeId;
          return (
            <li key={trade.id}>
              <div
                className={`${styles.tradeCard} ${selected ? styles.selected : ''}`}
                role="button"
                tabIndex={0}
                aria-pressed={selected}
                onClick={() => onSelectTrade(selected ? null : trade.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelectTrade(selected ? null : trade.id);
                  }
                }}
              >
                <div className={styles.tradeSides}>
                  {trade.sides.map((side, index) => (
                    <Fragment key={side.teamId}>
                      {index === 1 && (
                        <span className={styles.swapArrow} aria-hidden="true">
                          ↔
                        </span>
                      )}
                      <article>
                        <div
                          className={styles.managerWrap}
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => event.stopPropagation()}
                        >
                          <ManagerBadge
                            name={side.manager}
                            size="sm"
                            leagueId={leagueId}
                          />
                        </div>
                        <span className={styles.teamName}>{side.teamName}</span>
                        <p className={styles.sentLabel}>Gave these picks</p>
                        <ul className={styles.chipRow}>
                          {side.sent.map((pick) => (
                            <PickChip
                              key={pick.pick}
                              pick={pick}
                              fromManager={acquiredFromManager(
                                pick,
                                side.teamId,
                                trades,
                                trade.id
                              )}
                            />
                          ))}
                        </ul>
                      </article>
                    </Fragment>
                  ))}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {unresolved.map((item) => (
        <div key={item.id} className={styles.unresolved}>
          <p className={styles.unresolvedNotes}>{item.notes}</p>
          <ul>
            {item.picks.map((pick) => (
              <li key={pick.pick}>
                <span className={styles.pickLabel}>{pick.label}</span>
                used by {pick.actualManager} ({pick.actualTeamName}); home slot
                was {pick.originalManager} ({pick.originalTeamName})
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

export function Drafts() {
  const { leagueId, year } = useParams<{ leagueId: string; year?: string }>();
  const [view, setView] = useState<DraftView>('board');
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);

  const validLeagueId = leagueId && isValidLeague(leagueId) ? leagueId : null;
  const displayYears = validLeagueId ? getDisplayYears(validLeagueId) : [];
  const selectedYear = year ? parseInt(year, 10) : displayYears[0];

  useEffect(() => {
    setSelectedTradeId(null);
  }, [validLeagueId, selectedYear]);
  const seasonData =
    validLeagueId && selectedYear
      ? getSeasonData(validLeagueId, selectedYear)
      : null;
  const playoffOnly =
    validLeagueId && selectedYear
      ? isPlayoffOnlyYear(validLeagueId, selectedYear)
      : false;
  const draftDayTrades =
    validLeagueId && selectedYear
      ? getDraftDayTrades(validLeagueId, selectedYear)
      : [];
  const draftDayUnresolved =
    validLeagueId && selectedYear
      ? getDraftDayUnresolved(validLeagueId, selectedYear)
      : [];

  const teamLookup = useMemo(
    () => (seasonData ? createTeamLookup(seasonData.teams) : new Map()),
    [seasonData]
  );

  const highlightedPicks = useMemo(() => {
    const trade = draftDayTrades.find((item) => item.id === selectedTradeId);
    return new Set(trade ? tradePickNumbers(trade) : []);
  }, [draftDayTrades, selectedTradeId]);

  const teamCount = seasonData?.teams.length ?? 0;

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
          <DraftDayTradesSection
            leagueId={validLeagueId}
            trades={draftDayTrades}
            unresolved={draftDayUnresolved}
            selectedTradeId={selectedTradeId}
            onSelectTrade={setSelectedTradeId}
          />

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
                      const highlighted = highlightedPicks.has(pick.pick);
                      return (
                        <tr
                          key={pick.pick}
                          className={
                            highlighted ? styles.highlighted : undefined
                          }
                        >
                          <td className={styles.pickNumber}>
                            <span>{formatSnakePick(pick.pick, teamCount)}</span>
                            <span className={styles.overallPick}>
                              #{pick.pick}
                            </span>
                          </td>
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
                    <ManagerBadge
                      name={team.manager}
                      leagueId={validLeagueId}
                    />
                    <span className={styles.teamName}>{team.name}</span>
                  </header>
                  <ol>
                    {picks.map((pick) => (
                      <li
                        key={pick.pick}
                        className={
                          highlightedPicks.has(pick.pick)
                            ? styles.highlighted
                            : undefined
                        }
                      >
                        <span className={styles.round}>
                          {formatSnakePick(pick.pick, teamCount)}
                        </span>
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
