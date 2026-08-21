import { useState, useMemo } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
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
import type { Matchup, Team, LeagueId, Trade } from '../../types';
import styles from './Season.module.scss';

type ViewMode = 'week' | 'team';
type WeekSelection = number | 'trades';

export function Season() {
  const { leagueId, year } = useParams<{ leagueId: string; year?: string }>();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedWeek, setSelectedWeek] = useState<WeekSelection>(1);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // Validate and get data
  const validLeagueId = leagueId && isValidLeague(leagueId) ? leagueId : null;
  const availableYears = validLeagueId ? getDisplayYears(validLeagueId) : [];
  const selectedYear = year ? parseInt(year, 10) : availableYears[0];
  const seasonData =
    validLeagueId && selectedYear
      ? getSeasonData(validLeagueId, selectedYear)
      : null;
  const playoffOnly =
    validLeagueId && selectedYear
      ? isPlayoffOnlyYear(validLeagueId, selectedYear)
      : false;

  // All hooks must be called unconditionally
  const teamLookup = useMemo(
    () => (seasonData ? createTeamLookup(seasonData.teams) : new Map()),
    [seasonData]
  );

  const seasonTrades = useMemo(() => {
    if (!seasonData?.trades) return [];
    return [...seasonData.trades].sort((a, b) => {
      const aTime = a.timestamp ?? 0;
      const bTime = b.timestamp ?? 0;
      return aTime - bTime;
    });
  }, [seasonData]);
  const weeks = useMemo(() => {
    if (!seasonData) return [];
    const weekSet = new Set(seasonData.matchups.map((m) => m.week));
    return Array.from(weekSet).sort((a, b) => a - b);
  }, [seasonData]);

  // Get sorted teams for team selector
  const sortedTeams = useMemo(() => {
    if (!seasonData) return [];
    return [...seasonData.teams].sort((a, b) => a.rank - b.rank);
  }, [seasonData]);

  // Filter matchups based on view mode
  const filteredMatchups = useMemo(() => {
    if (!seasonData) return [];

    if (viewMode === 'week') {
      if (selectedWeek === 'trades') return [];
      return seasonData.matchups.filter((m) => m.week === selectedWeek);
    } else {
      if (!selectedTeamId) return [];
      return seasonData.matchups.filter(
        (m) => m.team1Id === selectedTeamId || m.team2Id === selectedTeamId
      );
    }
  }, [seasonData, viewMode, selectedWeek, selectedTeamId]);

  // Set initial team selection when switching to team view
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'team' && !selectedTeamId && sortedTeams.length > 0) {
      setSelectedTeamId(sortedTeams[0].id);
    }
  };

  // Return after all hooks
  if (!validLeagueId) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={styles.season}>
      <header className={styles.header}>
        <h1>{selectedYear} Season</h1>
        <YearSelector
          years={availableYears}
          selectedYear={selectedYear}
          hrefForYear={(y) => `/${validLeagueId}/season/${y}`}
        />
      </header>

      {playoffOnly && (
        <PlayoffOnlyNotice leagueId={validLeagueId} year={selectedYear} />
      )}

      {!playoffOnly && !seasonData && (
        <p className={styles.noData}>No season data available.</p>
      )}

      {seasonData && (
        <>
          <div className={styles.controls}>
            <div className={styles.viewToggle}>
              <button
                className={viewMode === 'week' ? styles.active : ''}
                onClick={() => handleViewModeChange('week')}
              >
                By Week
              </button>
              <button
                className={viewMode === 'team' ? styles.active : ''}
                onClick={() => handleViewModeChange('team')}
              >
                By Team
              </button>
            </div>

            {viewMode === 'week' ? (
              <div className={styles.weekSelector}>
                {weeks.map((week) => (
                  <button
                    key={week}
                    className={week === selectedWeek ? styles.active : ''}
                    onClick={() => setSelectedWeek(week)}
                  >
                    {week}
                  </button>
                ))}
                <button
                  className={`${styles.tradesTab} ${selectedWeek === 'trades' ? styles.active : ''}`}
                  onClick={() => setSelectedWeek('trades')}
                >
                  Trades
                </button>
              </div>
            ) : (
              <div className={styles.teamSelector}>
                {sortedTeams.map((team) => (
                  <button
                    key={team.id}
                    className={team.id === selectedTeamId ? styles.active : ''}
                    onClick={() => setSelectedTeamId(team.id)}
                  >
                    <ManagerBadge
                      name={team.manager}
                      size="sm"
                      showName={false}
                      clickable={false}
                    />
                    <span className={styles.teamName}>{team.manager}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {viewMode === 'week' && selectedWeek === 'trades' ? (
            <SeasonTradesList trades={seasonTrades} leagueId={validLeagueId} />
          ) : (
            <div className={styles.matchupsGrid}>
              {filteredMatchups.map((matchup, index) => (
                <MatchupCard
                  key={`${matchup.week}-${matchup.team1Id}-${index}`}
                  matchup={matchup}
                  teamLookup={teamLookup}
                  leagueId={validLeagueId}
                  year={selectedYear}
                  showWeek={viewMode === 'team'}
                  highlightTeamId={viewMode === 'team' ? selectedTeamId : null}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function formatTradeDate(trade: Trade) {
  if (!trade.date) return null;
  return new Date(trade.date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function SeasonTradesList({
  trades,
  leagueId,
}: {
  trades: Trade[];
  leagueId: LeagueId;
}) {
  if (trades.length === 0) {
    return <p className={styles.noTrades}>No in-season trades this year.</p>;
  }

  return (
    <ul className={styles.tradesList}>
      {trades.map((trade) => (
        <li key={trade.id} className={styles.tradeCard}>
          {formatTradeDate(trade) && (
            <span className={styles.tradeDate}>{formatTradeDate(trade)}</span>
          )}
          <div className={styles.tradeSides}>
            {trade.sides.map((side) => (
              <article key={`${trade.id}-${side.teamId}`}>
                {side.manager ? (
                  <ManagerBadge
                    name={side.manager}
                    size="sm"
                    leagueId={leagueId}
                  />
                ) : (
                  <strong>{side.teamName}</strong>
                )}
                <p>
                  <span>Gave</span> {side.sent.join(', ') || '—'}
                </p>
                <p>
                  <span>Got</span> {side.received.join(', ') || '—'}
                </p>
              </article>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}

interface MatchupCardProps {
  matchup: Matchup;
  teamLookup: Map<string, Team>;
  leagueId: LeagueId;
  year: number;
  showWeek?: boolean;
  highlightTeamId?: string | null;
}

function MatchupCard({
  matchup,
  teamLookup,
  leagueId,
  year,
  showWeek = false,
  highlightTeamId,
}: MatchupCardProps) {
  const team1 = teamLookup.get(matchup.team1Id);
  const team2 = teamLookup.get(matchup.team2Id);

  const team1Won =
    matchup.isComplete && matchup.team1Points > matchup.team2Points;
  const team2Won =
    matchup.isComplete && matchup.team2Points > matchup.team1Points;
  const isTie =
    matchup.isComplete && matchup.team1Points === matchup.team2Points;

  const getMatchupType = () => {
    if (matchup.isMultiWeekFinal) return 'Final (week 2 of 2)';
    if (matchup.isConsolation) return 'Consolation';
    if (matchup.isPlayoff) return 'Playoff';
    return null;
  };

  const matchupType = getMatchupType();

  return (
    <Link
      to={`/${leagueId}/season/${year}/matchup/${matchup.week}/${matchup.team1Id}`}
      className={`${styles.matchupCard} ${matchup.isConsolation ? styles.consolation : ''} ${matchup.isPlayoff && !matchup.isConsolation ? styles.playoff : ''}`}
    >
      {(showWeek || matchupType) && (
        <div className={styles.matchupMeta}>
          {showWeek && (
            <span className={styles.weekBadge}>Week {matchup.week}</span>
          )}
          {matchupType && (
            <span className={styles.typeBadge}>{matchupType}</span>
          )}
        </div>
      )}

      <div
        className={`${styles.teamRow} ${team1Won ? styles.winner : ''} ${highlightTeamId === matchup.team1Id ? styles.highlighted : ''}`}
      >
        <div className={styles.teamInfo}>
          {team1 && (
            <ManagerBadge name={team1.manager} size="sm" leagueId={leagueId} />
          )}
        </div>
        <div className={styles.score}>
          {matchup.isComplete ? matchup.team1Points.toFixed(2) : '-'}
        </div>
      </div>

      <div className={styles.versus}>{isTie ? 'TIE' : 'vs'}</div>

      <div
        className={`${styles.teamRow} ${team2Won ? styles.winner : ''} ${highlightTeamId === matchup.team2Id ? styles.highlighted : ''}`}
      >
        <div className={styles.teamInfo}>
          {team2 && (
            <ManagerBadge name={team2.manager} size="sm" leagueId={leagueId} />
          )}
        </div>
        <div className={styles.score}>
          {matchup.isComplete ? matchup.team2Points.toFixed(2) : '-'}
        </div>
      </div>
    </Link>
  );
}
