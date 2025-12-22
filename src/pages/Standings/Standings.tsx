import { useMemo, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { getSeasonData, getAvailableYears, isValidLeague, getPlayoffYear } from '../../data';
import { ManagerBadge } from '../../components/ManagerBadge/ManagerBadge';
import type { LeagueId } from '../../types';
import styles from './Standings.module.scss';

const MIN_SEASONS_THRESHOLD = 5;

type SortDirection = 'asc' | 'desc';

// All-time sort columns
type AllTimeSortColumn = 'manager' | 'seasons' | 'wins' | 'losses' | 'ties' | 'winPct' | 'avgPF' | 'avgPA';

// Single season sort columns
type SeasonSortColumn = 'rank' | 'manager' | 'team' | 'wins' | 'losses' | 'ties' | 'winPct' | 'pf' | 'pa' | 'seed';

interface AllTimeStats {
  manager: string;
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
  totalPointsFor: number;
  totalPointsAgainst: number;
  gamesPlayed: number;
  avgPointsFor: number;
  avgPointsAgainst: number;
  seasonsPlayed: number;
}

interface SortableHeaderProps {
  column: string;
  label: string;
  currentSort: string;
  direction: SortDirection;
  onSort: (column: string) => void;
}

function SortableHeader({ column, label, currentSort, direction, onSort }: SortableHeaderProps) {
  const isActive = currentSort === column;
  return (
    <th
      className={`${styles.sortable} ${isActive ? styles.sorted : ''}`}
      onClick={() => onSort(column)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSort(column)}
    >
      {label}
      <span className={styles.sortIcon}>
        {isActive ? (direction === 'asc' ? '▲' : '▼') : ''}
      </span>
    </th>
  );
}

function calculateAllTimeStandings(
  leagueId: LeagueId,
  years: number[]
): AllTimeStats[] {
  const managerStats = new Map<string, AllTimeStats>();

  for (const year of years) {
    const seasonData = getSeasonData(leagueId, year);
    if (!seasonData) continue;

    // Build a lookup for points from matchups
    const teamPoints = new Map<string, { pointsFor: number; pointsAgainst: number; games: number }>();
    
    for (const matchup of seasonData.matchups) {
      if (!matchup.isComplete) continue;
      
      // Team 1
      const team1Stats = teamPoints.get(matchup.team1Id) || { pointsFor: 0, pointsAgainst: 0, games: 0 };
      team1Stats.pointsFor += matchup.team1Points;
      team1Stats.pointsAgainst += matchup.team2Points;
      team1Stats.games++;
      teamPoints.set(matchup.team1Id, team1Stats);
      
      // Team 2
      const team2Stats = teamPoints.get(matchup.team2Id) || { pointsFor: 0, pointsAgainst: 0, games: 0 };
      team2Stats.pointsFor += matchup.team2Points;
      team2Stats.pointsAgainst += matchup.team1Points;
      team2Stats.games++;
      teamPoints.set(matchup.team2Id, team2Stats);
    }

    for (const team of seasonData.teams) {
      const existing = managerStats.get(team.manager) || {
        manager: team.manager,
        wins: 0,
        losses: 0,
        ties: 0,
        winPct: 0,
        totalPointsFor: 0,
        totalPointsAgainst: 0,
        gamesPlayed: 0,
        avgPointsFor: 0,
        avgPointsAgainst: 0,
        seasonsPlayed: 0,
      };

      existing.wins += team.wins;
      existing.losses += team.losses;
      existing.ties += team.ties;
      existing.seasonsPlayed++;

      const points = teamPoints.get(team.id);
      if (points) {
        existing.totalPointsFor += points.pointsFor;
        existing.totalPointsAgainst += points.pointsAgainst;
        existing.gamesPlayed += points.games;
      }

      managerStats.set(team.manager, existing);
    }
  }

  // Calculate final percentages and averages
  const results: AllTimeStats[] = [];
  for (const stats of managerStats.values()) {
    const totalGames = stats.wins + stats.losses + stats.ties;
    stats.winPct = totalGames > 0 ? stats.wins / totalGames : 0;
    stats.avgPointsFor = stats.gamesPlayed > 0 ? stats.totalPointsFor / stats.gamesPlayed : 0;
    stats.avgPointsAgainst = stats.gamesPlayed > 0 ? stats.totalPointsAgainst / stats.gamesPlayed : 0;
    results.push(stats);
  }

  return results;
}

export function Standings() {
  const { leagueId, year } = useParams<{ leagueId: string; year?: string }>();
  const [hidePartTimers, setHidePartTimers] = useState(true);
  
  // Sort state for all-time view
  const [allTimeSortColumn, setAllTimeSortColumn] = useState<AllTimeSortColumn>('winPct');
  const [allTimeSortDir, setAllTimeSortDir] = useState<SortDirection>('desc');
  
  // Sort state for single season view
  const [seasonSortColumn, setSeasonSortColumn] = useState<SeasonSortColumn>('rank');
  const [seasonSortDir, setSeasonSortDir] = useState<SortDirection>('asc');

  // Validate and get data
  const validLeagueId = leagueId && isValidLeague(leagueId) ? leagueId : null;
  const availableYears = useMemo(
    () => (validLeagueId ? getAvailableYears(validLeagueId) : []),
    [validLeagueId]
  );
  const isAllTime = year === 'all-time';
  const selectedYear = isAllTime ? null : (year ? parseInt(year, 10) : availableYears[0]);
  const seasonData = validLeagueId && selectedYear ? getSeasonData(validLeagueId, selectedYear) : null;

  // Calculate points for/against from matchups for single season view
  const teamPointsMap = useMemo(() => {
    if (!seasonData) return new Map<string, { pointsFor: number; pointsAgainst: number }>();
    
    const pointsMap = new Map<string, { pointsFor: number; pointsAgainst: number }>();
    
    for (const matchup of seasonData.matchups) {
      if (!matchup.isComplete) continue;
      
      const team1Stats = pointsMap.get(matchup.team1Id) || { pointsFor: 0, pointsAgainst: 0 };
      team1Stats.pointsFor += matchup.team1Points;
      team1Stats.pointsAgainst += matchup.team2Points;
      pointsMap.set(matchup.team1Id, team1Stats);
      
      const team2Stats = pointsMap.get(matchup.team2Id) || { pointsFor: 0, pointsAgainst: 0 };
      team2Stats.pointsFor += matchup.team2Points;
      team2Stats.pointsAgainst += matchup.team1Points;
      pointsMap.set(matchup.team2Id, team2Stats);
    }
    
    return pointsMap;
  }, [seasonData]);

  // All-time standings with sorting
  const allTimeStandings = useMemo(() => {
    if (!isAllTime || !validLeagueId) return null;
    let standings = calculateAllTimeStandings(validLeagueId, availableYears);
    
    if (hidePartTimers) {
      standings = standings.filter(s => s.seasonsPlayed >= MIN_SEASONS_THRESHOLD);
    }

    // Sort
    const multiplier = allTimeSortDir === 'asc' ? 1 : -1;
    standings.sort((a, b) => {
      switch (allTimeSortColumn) {
        case 'manager':
          return multiplier * a.manager.localeCompare(b.manager);
        case 'seasons':
          return multiplier * (a.seasonsPlayed - b.seasonsPlayed);
        case 'wins':
          return multiplier * (a.wins - b.wins);
        case 'losses':
          return multiplier * (a.losses - b.losses);
        case 'ties':
          return multiplier * (a.ties - b.ties);
        case 'winPct':
          return multiplier * (a.winPct - b.winPct);
        case 'avgPF':
          return multiplier * (a.avgPointsFor - b.avgPointsFor);
        case 'avgPA':
          return multiplier * (a.avgPointsAgainst - b.avgPointsAgainst);
        default:
          return 0;
      }
    });

    return standings;
  }, [isAllTime, validLeagueId, availableYears, hidePartTimers, allTimeSortColumn, allTimeSortDir]);

  // Get playoff year data for champion/runner-up medals
  const playoffYearData = useMemo(() => {
    if (!selectedYear || !validLeagueId) return null;
    return getPlayoffYear(validLeagueId, selectedYear);
  }, [validLeagueId, selectedYear]);

  // For CWP, check if we need to hide 5th/6th seeds (when there are exactly 6 seeds)
  const cwpHideFakePlayoffSeeds = useMemo(() => {
    if (validLeagueId !== 'cwp' || !seasonData) return false;
    const seedCount = seasonData.teams.filter(t => t.playoffSeed && t.playoffSeed <= 6).length;
    return seedCount === 6;
  }, [validLeagueId, seasonData]);

  // Single season standings with sorting
  const sortedTeams = useMemo(() => {
    if (!seasonData) return [];
    
    const teamsWithPoints = seasonData.teams.map(team => {
      const points = teamPointsMap.get(team.id);
      const totalGames = team.wins + team.losses + team.ties;
      
      // Determine display playoff seed (hide 5th/6th for CWP when applicable)
      let displayPlayoffSeed: number | undefined = team.playoffSeed;
      if (cwpHideFakePlayoffSeeds && team.playoffSeed && team.playoffSeed >= 5) {
        displayPlayoffSeed = undefined;
      }
      
      // Check if this team is champion or runner-up
      const lowerManager = team.manager.toLowerCase();
      const isChampion = playoffYearData?.champion.toLowerCase() === lowerManager;
      const isRunnerUp = playoffYearData?.runnerUp.toLowerCase() === lowerManager;
      
      return {
        ...team,
        pointsFor: points?.pointsFor || 0,
        pointsAgainst: points?.pointsAgainst || 0,
        winPct: totalGames > 0 ? team.wins / totalGames : 0,
        displayPlayoffSeed,
        isChampion,
        isRunnerUp,
      };
    });

    const multiplier = seasonSortDir === 'asc' ? 1 : -1;
    teamsWithPoints.sort((a, b) => {
      switch (seasonSortColumn) {
        case 'rank':
          return multiplier * (a.rank - b.rank);
        case 'manager':
          return multiplier * a.manager.localeCompare(b.manager);
        case 'team':
          return multiplier * a.name.localeCompare(b.name);
        case 'wins':
          return multiplier * (a.wins - b.wins);
        case 'losses':
          return multiplier * (a.losses - b.losses);
        case 'ties':
          return multiplier * (a.ties - b.ties);
        case 'winPct':
          return multiplier * (a.winPct - b.winPct);
        case 'pf':
          return multiplier * (a.pointsFor - b.pointsFor);
        case 'pa':
          return multiplier * (a.pointsAgainst - b.pointsAgainst);
        case 'seed':
          return multiplier * ((a.displayPlayoffSeed || 999) - (b.displayPlayoffSeed || 999));
        default:
          return 0;
      }
    });

    return teamsWithPoints;
  }, [seasonData, teamPointsMap, seasonSortColumn, seasonSortDir, cwpHideFakePlayoffSeeds, playoffYearData]);

  const handleAllTimeSort = (column: string) => {
    const col = column as AllTimeSortColumn;
    if (allTimeSortColumn === col) {
      setAllTimeSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setAllTimeSortColumn(col);
      // Default to descending for numeric columns, ascending for text
      setAllTimeSortDir(col === 'manager' ? 'asc' : 'desc');
    }
  };

  const handleSeasonSort = (column: string) => {
    const col = column as SeasonSortColumn;
    if (seasonSortColumn === col) {
      setSeasonSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSeasonSortColumn(col);
      // Default to ascending for rank/text, descending for stats
      setSeasonSortDir(['rank', 'manager', 'team'].includes(col) ? 'asc' : 'desc');
    }
  };

  // Return after all hooks
  if (!validLeagueId) {
    return <Navigate to="/" replace />;
  }

  if (!isAllTime && !seasonData) {
    return (
      <div className={styles.standings}>
        <h1>Standings</h1>
        <p className={styles.noData}>No standings data available.</p>
      </div>
    );
  }

  return (
    <div className={styles.standings}>
      <header className={styles.header}>
        <h1>{isAllTime ? 'All-Time Standings' : `${selectedYear} Standings`}</h1>
        <div className={styles.yearSelector}>
          <a
            href={`/${validLeagueId}/standings/all-time`}
            className={isAllTime ? styles.active : ''}
          >
            All-Time
          </a>
          {availableYears.map((y) => (
            <a
              key={y}
              href={`/${validLeagueId}/standings/${y}`}
              className={y === selectedYear ? styles.active : ''}
            >
              {y}
            </a>
          ))}
        </div>
      </header>

      {isAllTime && (
        <div className={styles.filterBar}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={hidePartTimers}
              onChange={(e) => setHidePartTimers(e.target.checked)}
            />
            <span className={styles.toggleSlider}></span>
            <span className={styles.toggleLabel}>
              Hide managers with less than {MIN_SEASONS_THRESHOLD} seasons
            </span>
          </label>
        </div>
      )}

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          {isAllTime && allTimeStandings ? (
            <table className={styles.standingsTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <SortableHeader column="manager" label="Manager" currentSort={allTimeSortColumn} direction={allTimeSortDir} onSort={handleAllTimeSort} />
                  <SortableHeader column="seasons" label="Seasons" currentSort={allTimeSortColumn} direction={allTimeSortDir} onSort={handleAllTimeSort} />
                  <SortableHeader column="wins" label="W" currentSort={allTimeSortColumn} direction={allTimeSortDir} onSort={handleAllTimeSort} />
                  <SortableHeader column="losses" label="L" currentSort={allTimeSortColumn} direction={allTimeSortDir} onSort={handleAllTimeSort} />
                  <SortableHeader column="ties" label="T" currentSort={allTimeSortColumn} direction={allTimeSortDir} onSort={handleAllTimeSort} />
                  <SortableHeader column="winPct" label="Win %" currentSort={allTimeSortColumn} direction={allTimeSortDir} onSort={handleAllTimeSort} />
                  <SortableHeader column="avgPF" label="Avg PF" currentSort={allTimeSortColumn} direction={allTimeSortDir} onSort={handleAllTimeSort} />
                  <SortableHeader column="avgPA" label="Avg PA" currentSort={allTimeSortColumn} direction={allTimeSortDir} onSort={handleAllTimeSort} />
                </tr>
              </thead>
              <tbody>
                {allTimeStandings.map((stats, index) => (
                  <tr key={stats.manager}>
                    <td className={styles.rank}>{index + 1}</td>
                    <td className={styles.managerCell}>
                      <ManagerBadge
                        name={stats.manager}
                        size="sm"
                        leagueId={validLeagueId}
                      />
                    </td>
                    <td className={styles.seasons}>{stats.seasonsPlayed}</td>
                    <td>{stats.wins}</td>
                    <td>{stats.losses}</td>
                    <td>{stats.ties}</td>
                    <td className={styles.winPct}>
                      {(stats.winPct * 100).toFixed(1)}%
                    </td>
                    <td className={styles.points}>{stats.avgPointsFor.toFixed(1)}</td>
                    <td className={styles.points}>{stats.avgPointsAgainst.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className={styles.standingsTable}>
              <thead>
                <tr>
                  <SortableHeader column="rank" label="Rank" currentSort={seasonSortColumn} direction={seasonSortDir} onSort={handleSeasonSort} />
                  <SortableHeader column="manager" label="Manager" currentSort={seasonSortColumn} direction={seasonSortDir} onSort={handleSeasonSort} />
                  <SortableHeader column="team" label="Team" currentSort={seasonSortColumn} direction={seasonSortDir} onSort={handleSeasonSort} />
                  <SortableHeader column="wins" label="W" currentSort={seasonSortColumn} direction={seasonSortDir} onSort={handleSeasonSort} />
                  <SortableHeader column="losses" label="L" currentSort={seasonSortColumn} direction={seasonSortDir} onSort={handleSeasonSort} />
                  <SortableHeader column="ties" label="T" currentSort={seasonSortColumn} direction={seasonSortDir} onSort={handleSeasonSort} />
                  <SortableHeader column="winPct" label="Win %" currentSort={seasonSortColumn} direction={seasonSortDir} onSort={handleSeasonSort} />
                  <SortableHeader column="pf" label="PF" currentSort={seasonSortColumn} direction={seasonSortDir} onSort={handleSeasonSort} />
                  <SortableHeader column="pa" label="PA" currentSort={seasonSortColumn} direction={seasonSortDir} onSort={handleSeasonSort} />
                  <SortableHeader column="seed" label="Seed" currentSort={seasonSortColumn} direction={seasonSortDir} onSort={handleSeasonSort} />
                </tr>
              </thead>
              <tbody>
                {sortedTeams.map((team) => (
                  <tr
                    key={team.id}
                    className={team.displayPlayoffSeed ? styles.playoffTeam : ''}
                  >
                    <td className={styles.rank}>
                      {team.rank}
                      {team.isChampion && <span className={styles.medal}>🥇</span>}
                      {team.isRunnerUp && <span className={styles.medal}>🥈</span>}
                    </td>
                    <td className={styles.managerCell}>
                      <ManagerBadge
                        name={team.manager}
                        size="sm"
                        leagueId={validLeagueId}
                      />
                    </td>
                    <td className={styles.teamName}>{team.name}</td>
                    <td>{team.wins}</td>
                    <td>{team.losses}</td>
                    <td>{team.ties}</td>
                    <td className={styles.winPct}>
                      {(team.winPct * 100).toFixed(1)}%
                    </td>
                    <td className={styles.points}>
                      {team.pointsFor.toFixed(1)}
                    </td>
                    <td className={styles.points}>
                      {team.pointsAgainst.toFixed(1)}
                    </td>
                    <td className={styles.seed}>
                      {team.displayPlayoffSeed ? team.displayPlayoffSeed : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
