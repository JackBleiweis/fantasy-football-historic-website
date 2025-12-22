import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useManagerModal } from '../../hooks/useManagerModal';
import { useManagerStats } from '../../hooks/useManagerStats';
import { getManagerAvatar } from '../../data/managerAvatars';
import styles from './ManagerModal.module.scss';

export function ManagerModal() {
  const { state, closeModal } = useManagerModal();
  const { isOpen, managerName, leagueId } = state;

  const stats = useManagerStats(managerName || '', leagueId || 'cwp');

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeModal]);

  if (!isOpen || !managerName || !stats) return null;

  const avatarUrl = getManagerAvatar(managerName);
  const initials = managerName.charAt(0).toUpperCase();

  const getPlayoffResult = (season: {
    isChampion: boolean;
    isRunnerUp: boolean;
    madePlayoffs: boolean;
  }) => {
    if (season.isChampion) return '🏆 Champion';
    if (season.isRunnerUp) return '2nd Place';
    if (season.madePlayoffs) return 'Playoffs';
    return 'Missed Playoffs';
  };

  const modalContent = (
    <div className={styles.overlay} onClick={closeModal}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="manager-name"
      >
        <button
          className={styles.closeButton}
          onClick={closeModal}
          aria-label="Close modal"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <header className={styles.header}>
          <div className={styles.avatar}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={managerName} />
            ) : (
              <span className={styles.initials}>{initials}</span>
            )}
          </div>
          <div className={styles.headerInfo}>
            <h2 id="manager-name">{managerName}</h2>
            <p className={styles.subtitle}>
              {stats.seasons.length} season{stats.seasons.length !== 1 ? 's' : ''}
              {stats.championshipsWon > 0 && (
                <span className={styles.trophies}>
                  {' • '}
                  {Array(stats.championshipsWon).fill('🏆').join('')}
                </span>
              )}
            </p>
          </div>
        </header>

        <section className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>All-Time Record</span>
            <span className={styles.statValue}>
              {stats.totalWins}-{stats.totalLosses}
              {stats.totalTies > 0 && `-${stats.totalTies}`}
            </span>
            <span className={styles.statMeta}>
              {(stats.winPercentage * 100).toFixed(1)}% win rate
            </span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Points</span>
            <span className={styles.statValue}>
              {stats.totalPointsScored.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </span>
            <span className={styles.statMeta}>Career points scored</span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>Avg Points/Week</span>
            <span className={styles.statValue}>
              {stats.averagePointsPerWeek.toFixed(2)}
            </span>
            <span className={styles.statMeta}>Per game average</span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>Highest Score</span>
            <span className={styles.statValue}>
              {stats.highestSingleGameScore.toFixed(2)}
            </span>
            {stats.highestGameDetails && (
              <span className={styles.statMeta}>
                Week {stats.highestGameDetails.week},{' '}
                {stats.highestGameDetails.year} vs{' '}
                {stats.highestGameDetails.opponent}
              </span>
            )}
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>Championships</span>
            <span className={styles.statValue}>{stats.championshipsWon}</span>
            <span className={styles.statMeta}>
              {stats.championshipYears.length > 0
                ? stats.championshipYears.join(', ')
                : 'No championships yet'}
            </span>
            <span className={styles.statMeta}>
              {stats.finalsAppearances} finals, {stats.playoffAppearances} playoffs
            </span>
          </div>
        </section>

        <section className={styles.seasonsSection}>
          <h3>Season-by-Season</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.seasonsTable}>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Team</th>
                  <th>Record</th>
                  <th>Rank</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {stats.seasons.map((season) => (
                  <tr
                    key={season.year}
                    className={season.isChampion ? styles.champion : ''}
                  >
                    <td className={styles.year}>{season.year}</td>
                    <td className={styles.teamName}>{season.teamName}</td>
                    <td className={styles.record}>
                      {season.wins}-{season.losses}
                      {season.ties > 0 && `-${season.ties}`}
                    </td>
                    <td className={styles.rank}>#{season.rank}</td>
                    <td className={styles.result}>
                      {getPlayoffResult(season)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
