import { useMemo, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { getSeasonData, getAvailableYears, isValidLeague } from '../../data';
import { ManagerBadge } from '../../components/ManagerBadge/ManagerBadge';
import type { LeagueId } from '../../types';
import styles from './Standings.module.scss';

const MIN_SEASONS_THRESHOLD = 5;

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

  // Sort by win percentage (descending)
  return results.sort((a, b) => b.winPct - a.winPct);
}

export function Standings() {
  const { leagueId, year } = useParams<{ leagueId: string; year?: string }>();
  const [hidePartTimers, setHidePartTimers] = useState(true);

  // Validate league ID
  if (!leagueId || !isValidLeague(leagueId)) {
    return <Navigate to="/" replace />;
  }

  const availableYears = getAvailableYears(leagueId);
  const isAllTime = year === 'all-time';
  const selectedYear = isAllTime ? null : (year ? parseInt(year, 10) : availableYears[0]);
  
  const seasonData = selectedYear ? getSeasonData(leagueId, selectedYear) : null;

  const allTimeStandings = useMemo(() => {
    if (!isAllTime) return null;
    const standings = calculateAllTimeStandings(leagueId, availableYears);
    if (hidePartTimers) {
      return standings.filter(s => s.seasonsPlayed >= MIN_SEASONS_THRESHOLD);
    }
    return standings;
  }, [isAllTime, leagueId, availableYears, hidePartTimers]);

  if (!isAllTime && !seasonData) {
    return (
      <div className={styles.standings}>
        <h1>Standings</h1>
        <p className={styles.noData}>No standings data available.</p>
      </div>
    );
  }

  // Calculate points for/against from matchups for single season view
  const teamPointsMap = useMemo(() => {
    if (!seasonData) return new Map<string, { pointsFor: number; pointsAgainst: number }>();
    
    const pointsMap = new Map<string, { pointsFor: number; pointsAgainst: number }>();
    
    for (const matchup of seasonData.matchups) {
      if (!matchup.isComplete) continue;
      
      // Team 1
      const team1Stats = pointsMap.get(matchup.team1Id) || { pointsFor: 0, pointsAgainst: 0 };
      team1Stats.pointsFor += matchup.team1Points;
      team1Stats.pointsAgainst += matchup.team2Points;
      pointsMap.set(matchup.team1Id, team1Stats);
      
      // Team 2
      const team2Stats = pointsMap.get(matchup.team2Id) || { pointsFor: 0, pointsAgainst: 0 };
      team2Stats.pointsFor += matchup.team2Points;
      team2Stats.pointsAgainst += matchup.team1Points;
      pointsMap.set(matchup.team2Id, team2Stats);
    }
    
    return pointsMap;
  }, [seasonData]);

  // Sort teams by rank for single season view
  const sortedTeams = seasonData
    ? [...seasonData.teams].sort((a, b) => a.rank - b.rank)
    : [];

  return (
    <div className={styles.standings}>
      <header className={styles.header}>
        <h1>{isAllTime ? 'All-Time Standings' : `${selectedYear} Standings`}</h1>
        <div className={styles.yearSelector}>
          <a
            href={`/${leagueId}/standings/all-time`}
            className={isAllTime ? styles.active : ''}
          >
            All-Time
          </a>
          {availableYears.map((y) => (
            <a
              key={y}
              href={`/${leagueId}/standings/${y}`}
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
                  <th>Manager</th>
                  <th>Seasons</th>
                  <th>W</th>
                  <th>L</th>
                  <th>T</th>
                  <th>Win %</th>
                  <th>Avg PF</th>
                  <th>Avg PA</th>
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
                        leagueId={leagueId}
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
                  <th>Rank</th>
                  <th>Manager</th>
                  <th>Team</th>
                  <th>W</th>
                  <th>L</th>
                  <th>T</th>
                  <th>Win %</th>
                  <th>PF</th>
                  <th>PA</th>
                  <th>Seed</th>
                </tr>
              </thead>
              <tbody>
                {sortedTeams.map((team, index) => {
                  const totalGames = team.wins + team.losses + team.ties;
                  const winPct = totalGames > 0 ? team.wins / totalGames : 0;
                  const teamPoints = teamPointsMap.get(team.id);

                  return (
                    <tr
                      key={team.id}
                      className={index < 6 ? styles.playoffTeam : ''}
                    >
                      <td className={styles.rank}>{team.rank}</td>
                      <td className={styles.managerCell}>
                        <ManagerBadge
                          name={team.manager}
                          size="sm"
                          leagueId={leagueId}
                        />
                      </td>
                      <td className={styles.teamName}>{team.name}</td>
                      <td>{team.wins}</td>
                      <td>{team.losses}</td>
                      <td>{team.ties}</td>
                      <td className={styles.winPct}>
                        {(winPct * 100).toFixed(1)}%
                      </td>
                      <td className={styles.points}>
                        {teamPoints?.pointsFor.toFixed(1) || '-'}
                      </td>
                      <td className={styles.points}>
                        {teamPoints?.pointsAgainst.toFixed(1) || '-'}
                      </td>
                      <td className={styles.seed}>
                        {team.playoffSeed <= 6 ? team.playoffSeed : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
