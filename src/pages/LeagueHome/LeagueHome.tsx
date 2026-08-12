import { useMemo, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import {
  getLeagueInfo,
  getLatestSeasonData,
  isValidLeague,
} from '../../data';
import { useManagerModal } from '../../hooks/useManagerModal';
import { getMatchupOfTheDay } from '../../utils/matchupOfTheDay';
import { getTradeOfTheDay } from '../../utils/tradeOfTheDay';
import { getLeagueManagerSummaries } from '../../utils/managerSummaries';
import { MatchupModal } from '../../components/MatchupModal/MatchupModal';
import { TradeModal } from '../../components/TradeModal/TradeModal';
import styles from './LeagueHome.module.scss';

export function LeagueHome() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const { openModal } = useManagerModal();
  const [showMatchupModal, setShowMatchupModal] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);

  // Validate and get league info
  const validLeagueId = leagueId && isValidLeague(leagueId) ? leagueId : null;
  const leagueInfo = validLeagueId ? getLeagueInfo(validLeagueId) : null;
  const latestSeason = validLeagueId ? getLatestSeasonData(validLeagueId) : null;

  // Calculate all manager rankings - must be called unconditionally
  const allManagers = useMemo(
    () => (validLeagueId ? getLeagueManagerSummaries(validLeagueId) : []),
    [validLeagueId]
  );

  // Get matchup of the day
  const matchupOfTheDay = useMemo(
    () => (validLeagueId ? getMatchupOfTheDay(validLeagueId) : null),
    [validLeagueId]
  );
  const tradeOfTheDay = useMemo(
    () => (validLeagueId ? getTradeOfTheDay(validLeagueId) : null),
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
      {/* Hall of Fame Section */}
      {topManagers.length > 0 && (
        <section className={styles.hallOfFame}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Hall of Fame</h2>
            <Link
              to={`/${validLeagueId}/managers`}
              className={styles.seeAllLink}
            >
              All managers
            </Link>
          </div>
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

      {(matchupOfTheDay || tradeOfTheDay) && (
        <section className={styles.matchupOfTheDay}>
          {matchupOfTheDay && (
            <button
              className={styles.matchupButton}
              onClick={() => setShowMatchupModal(true)}
            >
              <span className={styles.buttonIcon}>🎲</span>
              <span className={styles.buttonText}>Matchup of the Day</span>
            </button>
          )}
          {tradeOfTheDay && (
            <button
              className={styles.matchupButton}
              onClick={() => setShowTradeModal(true)}
            >
              <span className={styles.buttonIcon}>🔁</span>
              <span className={styles.buttonText}>Trade of the Day</span>
            </button>
          )}
        </section>
      )}

      {matchupOfTheDay && (
        <MatchupModal
          matchupData={matchupOfTheDay}
          isOpen={showMatchupModal}
          onClose={() => setShowMatchupModal(false)}
        />
      )}
      {tradeOfTheDay && validLeagueId && (
        <TradeModal
          trade={tradeOfTheDay}
          leagueId={validLeagueId}
          isOpen={showTradeModal}
          onClose={() => setShowTradeModal(false)}
        />
      )}
    </div>
  );
}
