import { useState, useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { getSeasonData, getAvailableYears, isValidLeague } from '../../data';
import { createTeamLookup } from '../../utils/teamUtils';
import { ManagerBadge } from '../../components/ManagerBadge/ManagerBadge';
import type { Matchup, Team, LeagueId } from '../../types';
import styles from './Season.module.scss';

type ViewMode = 'week' | 'team';

export function Season() {
  const { leagueId, year } = useParams<{ leagueId: string; year?: string }>();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // Validate league ID
  if (!leagueId || !isValidLeague(leagueId)) {
    return <Navigate to="/" replace />;
  }

  const availableYears = getAvailableYears(leagueId);
  const selectedYear = year ? parseInt(year, 10) : availableYears[0];
  const seasonData = selectedYear
    ? getSeasonData(leagueId, selectedYear)
    : null;

  const teamLookup = useMemo(
    () => (seasonData ? createTeamLookup(seasonData.teams) : new Map()),
    [seasonData]
  );

  // Get unique weeks from matchups
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

  if (!seasonData) {
    return (
      <div className={styles.season}>
        <h1>Season</h1>
        <p className={styles.noData}>No season data available.</p>
      </div>
    );
  }

  return (
    <div className={styles.season}>
      <header className={styles.header}>
        <h1>{selectedYear} Season</h1>
        {availableYears.length > 1 && (
          <div className={styles.yearSelector}>
            {availableYears.map((y) => (
              <a
                key={y}
                href={`/${leagueId}/season/${y}`}
                className={y === selectedYear ? styles.active : ''}
              >
                {y}
              </a>
            ))}
          </div>
        )}
      </header>

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

      <div className={styles.matchupsGrid}>
        {filteredMatchups.map((matchup, index) => (
          <MatchupCard
            key={`${matchup.week}-${matchup.team1Id}-${index}`}
            matchup={matchup}
            teamLookup={teamLookup}
            leagueId={leagueId}
            showWeek={viewMode === 'team'}
            highlightTeamId={viewMode === 'team' ? selectedTeamId : null}
          />
        ))}
      </div>
    </div>
  );
}

interface MatchupCardProps {
  matchup: Matchup;
  teamLookup: Map<string, Team>;
  leagueId: LeagueId;
  showWeek?: boolean;
  highlightTeamId?: string | null;
}

function MatchupCard({
  matchup,
  teamLookup,
  leagueId,
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
    if (matchup.isPlayoff) return 'Playoff';
    if (matchup.isConsolation) return 'Consolation';
    return null;
  };

  const matchupType = getMatchupType();

  return (
    <div
      className={`${styles.matchupCard} ${matchup.isPlayoff ? styles.playoff : ''} ${matchup.isConsolation ? styles.consolation : ''}`}
    >
      {(showWeek || matchupType) && (
        <div className={styles.matchupMeta}>
          {showWeek && <span className={styles.weekBadge}>Week {matchup.week}</span>}
          {matchupType && <span className={styles.typeBadge}>{matchupType}</span>}
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

      <div className={styles.versus}>
        {isTie ? 'TIE' : 'vs'}
      </div>

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
    </div>
  );
}
