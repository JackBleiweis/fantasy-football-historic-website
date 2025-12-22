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

interface TopManager {
  name: string;
  championships: number;
  wins: number;
  avatar?: string;
}

function calculateTopManagers(leagueId: LeagueId): TopManager[] {
  const managerStats = new Map<string, TopManager>();
  const years = getAvailableYears(leagueId);

  // Get wins from season data
  for (const year of years) {
    const seasonData = getSeasonData(leagueId, year);
    if (!seasonData) continue;

    for (const team of seasonData.teams) {
      const existing = managerStats.get(team.manager) || {
        name: team.manager,
        championships: 0,
        wins: 0,
        avatar: getManagerAvatar(team.manager),
      };
      existing.wins += team.wins;
      managerStats.set(team.manager, existing);
    }
  }

  // Get championships from playoff history
  for (const [manager, stats] of managerStats) {
    const playoffStats = getManagerPlayoffStats(leagueId, manager);
    stats.championships = playoffStats.championships;
  }

  // Convert to array and sort by championships (desc), then wins (desc)
  const allManagers = Array.from(managerStats.values());
  allManagers.sort((a, b) => {
    if (b.championships !== a.championships) {
      return b.championships - a.championships;
    }
    return b.wins - a.wins;
  });

  return allManagers.slice(0, 3);
}

export function LeagueHome() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const { openModal } = useManagerModal();

  // Validate and get league info
  const validLeagueId = leagueId && isValidLeague(leagueId) ? leagueId : null;
  const leagueInfo = validLeagueId ? getLeagueInfo(validLeagueId) : null;
  const latestSeason = validLeagueId ? getLatestSeasonData(validLeagueId) : null;

  // Calculate top managers - must be called unconditionally
  const topManagers = useMemo(
    () => (validLeagueId ? calculateTopManagers(validLeagueId) : []),
    [validLeagueId]
  );

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
