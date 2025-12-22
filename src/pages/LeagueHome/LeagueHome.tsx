import { useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import {
  getLeagueInfo,
  getLatestSeasonData,
  isValidLeague,
  getSeasonData,
  getAvailableYears,
  getManagerPlayoffStats,
} from '../../data';
import { getManagerAvatar } from '../../data/managerAvatars';
import { useManagerModal } from '../../hooks/useManagerModal';
import type { LeagueId } from '../../types';
import styles from './LeagueHome.module.scss';

interface ManagerRanking {
  name: string;
  championships: number;
  wins: number;
  avgPF: number;
  avatar?: string;
}

function calculateAllManagerRankings(leagueId: LeagueId): ManagerRanking[] {
  const managerStats = new Map<
    string,
    ManagerRanking & { totalPF: number; gamesPlayed: number }
  >();
  const years = getAvailableYears(leagueId);

  // Get wins and points from season data
  for (const year of years) {
    const seasonData = getSeasonData(leagueId, year);
    if (!seasonData) continue;

    // Build points map from matchups
    const teamPoints = new Map<string, { pf: number; games: number }>();
    for (const matchup of seasonData.matchups) {
      if (!matchup.isComplete) continue;

      const t1 = teamPoints.get(matchup.team1Id) || { pf: 0, games: 0 };
      t1.pf += matchup.team1Points;
      t1.games++;
      teamPoints.set(matchup.team1Id, t1);

      const t2 = teamPoints.get(matchup.team2Id) || { pf: 0, games: 0 };
      t2.pf += matchup.team2Points;
      t2.games++;
      teamPoints.set(matchup.team2Id, t2);
    }

    for (const team of seasonData.teams) {
      const existing = managerStats.get(team.manager) || {
        name: team.manager,
        championships: 0,
        wins: 0,
        avgPF: 0,
        totalPF: 0,
        gamesPlayed: 0,
        avatar: getManagerAvatar(team.manager),
      };
      existing.wins += team.wins;

      const points = teamPoints.get(team.id);
      if (points) {
        existing.totalPF += points.pf;
        existing.gamesPlayed += points.games;
      }

      managerStats.set(team.manager, existing);
    }
  }

  // Get championships from playoff history and calculate avg PF
  for (const [manager, stats] of managerStats) {
    const playoffStats = getManagerPlayoffStats(leagueId, manager);
    stats.championships = playoffStats.championships;
    stats.avgPF = stats.gamesPlayed > 0 ? stats.totalPF / stats.gamesPlayed : 0;
  }

  // Convert to array and sort by championships (desc), then wins (desc)
  const allManagers = Array.from(managerStats.values()).map(
    ({ ...rest }) => rest
  );
  
  allManagers.sort((a, b) => {
    if (b.championships !== a.championships) {
      return b.championships - a.championships;
    }
    return b.wins - a.wins;
  });

  return allManagers;
}

export function LeagueHome() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const { openModal } = useManagerModal();

  // Validate and get league info
  const validLeagueId = leagueId && isValidLeague(leagueId) ? leagueId : null;
  const leagueInfo = validLeagueId ? getLeagueInfo(validLeagueId) : null;
  const latestSeason = validLeagueId ? getLatestSeasonData(validLeagueId) : null;

  // Calculate all manager rankings - must be called unconditionally
  const allManagers = useMemo(
    () => (validLeagueId ? calculateAllManagerRankings(validLeagueId) : []),
    [validLeagueId]
  );

  // Split into podium (top 3) and rest
  const topManagers = allManagers.slice(0, 3);
  const restOfManagers = allManagers.slice(3);

  // Return after all hooks
  if (!validLeagueId || !leagueInfo) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={styles.leagueHome}>
      <header className={styles.header}>
        <h1>{leagueInfo.name}</h1>
        {leagueInfo.description && <p>{leagueInfo.description}</p>}
      </header>

      {/* Hall of Fame Section */}
      {topManagers.length > 0 && (
        <section className={styles.hallOfFame}>
          <h2 className={styles.sectionTitle}>Hall of Fame</h2>
          <div className={styles.podium}>
            {topManagers.map((manager, index) => (
              <button
                key={manager.name}
                className={`${styles.podiumSpot} ${styles[`place${index + 1}`]}`}
                onClick={() => openModal(manager.name, validLeagueId)}
                aria-label={`View ${manager.name}'s profile`}
              >
                {index === 0 && <div className={styles.crown}>👑</div>}
                <div className={styles.managerAvatar}>
                  {manager.avatar ? (
                    <img src={manager.avatar} alt={manager.name} />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {manager.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className={styles.managerDetails}>
                  <span className={styles.managerName}>{manager.name}</span>
                </div>
                <div className={styles.managerStats}>
                  <div className={styles.stat}>
                    <span className={styles.statValue}>{manager.championships}</span>
                    <span className={styles.statLabel}>🏆</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statValue}>{manager.wins}</span>
                    <span className={styles.statLabel}>Wins</span>
                  </div>
                </div>
                <div className={styles.placeNumber}>{index + 1}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Rest of the managers */}
      {restOfManagers.length > 0 && (
        <section className={styles.managerList}>
          {restOfManagers.map((manager, index) => (
            <button
              key={manager.name}
              className={styles.managerRow}
              onClick={() => openModal(manager.name, validLeagueId)}
              aria-label={`View ${manager.name}'s profile`}
            >
              <span className={styles.rowRank}>{index + 4}</span>
              <div className={styles.rowAvatar}>
                {manager.avatar ? (
                  <img src={manager.avatar} alt={manager.name} />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {manager.name.charAt(0)}
                  </div>
                )}
              </div>
              <span className={styles.rowName}>{manager.name}</span>
              <div className={styles.rowStats}>
                <span className={styles.rowStat}>
                  <span className={styles.rowStatValue}>{manager.championships}</span>
                  <span className={styles.rowStatLabel}>🏆</span>
                </span>
                <span className={styles.rowStat}>
                  <span className={styles.rowStatValue}>{manager.wins}</span>
                  <span className={styles.rowStatLabel}>W</span>
                </span>
                <span className={styles.rowStat}>
                  <span className={styles.rowStatValue}>{manager.avgPF.toFixed(1)}</span>
                  <span className={styles.rowStatLabel}>Avg</span>
                </span>
              </div>
            </button>
          ))}
        </section>
      )}

      {latestSeason ? (
        <section className={styles.latestSeason}>
          <h2>{latestSeason.year} Season</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>
                {latestSeason.teams.length}
              </span>
              <span className={styles.statLabel}>Teams</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>
                {latestSeason.matchups.filter((m) => m.isComplete).length}
              </span>
              <span className={styles.statLabel}>Games Played</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>
                {latestSeason.draft.length}
              </span>
              <span className={styles.statLabel}>Draft Picks</span>
            </div>
          </div>
        </section>
      ) : (
        <section className={styles.noData}>
          <p>No season data available yet.</p>
        </section>
      )}
    </div>
  );
}
