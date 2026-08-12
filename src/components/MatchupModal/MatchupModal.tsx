import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getManagerAvatar } from '../../data/managerAvatars';
import type { MatchupOfTheDay } from '../../utils/matchupOfTheDay';
import styles from './MatchupModal.module.scss';

interface MatchupModalProps {
  matchupData: MatchupOfTheDay;
  isOpen: boolean;
  onClose: () => void;
}

export function MatchupModal({ matchupData, isOpen, onClose }: MatchupModalProps) {
  const { matchup, year, team1, team2 } = matchupData;

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const team1Won = matchup.team1Points > matchup.team2Points;
  const team2Won = matchup.team2Points > matchup.team1Points;
  const isTie = matchup.team1Points === matchup.team2Points;
  const pointDiff = Math.abs(matchup.team1Points - matchup.team2Points);

  const team1Avatar = team1 ? getManagerAvatar(team1.manager) : undefined;
  const team2Avatar = team2 ? getManagerAvatar(team2.manager) : undefined;

  const modal = (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="matchup-title"
      >
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>

        <header className={styles.header}>
          <span className={styles.badge}>🎲 Matchup of the Day</span>
          <h2 id="matchup-title" className={styles.title}>
            {year} Season - Week {matchup.week}
          </h2>
          {matchup.isPlayoff && !matchup.isConsolation && (
            <span className={styles.playoffBadge}>🏆 Playoff Game</span>
          )}
          {matchup.isConsolation && (
            <span className={styles.playoffBadge}>Consolation</span>
          )}
        </header>

        <div className={styles.matchupCard}>
          {/* Team 1 */}
          <div className={`${styles.teamSide} ${team1Won ? styles.winner : ''}`}>
            <div className={styles.avatar}>
              {team1Avatar ? (
                <img src={team1Avatar} alt={team1?.manager || 'Team 1'} />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {team1?.manager?.charAt(0) || '?'}
                </div>
              )}
            </div>
            <div className={styles.teamInfo}>
              <span className={styles.managerName}>{team1?.manager || 'Unknown'}</span>
              <span className={styles.teamName}>{team1?.name || matchup.team1Name}</span>
            </div>
            <div className={styles.score}>
              {matchup.team1Points.toFixed(2)}
              {team1Won && <span className={styles.winIndicator}>W</span>}
            </div>
          </div>

          {/* VS Divider */}
          <div className={styles.versus}>
            {isTie ? 'TIE' : 'VS'}
          </div>

          {/* Team 2 */}
          <div className={`${styles.teamSide} ${team2Won ? styles.winner : ''}`}>
            <div className={styles.avatar}>
              {team2Avatar ? (
                <img src={team2Avatar} alt={team2?.manager || 'Team 2'} />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {team2?.manager?.charAt(0) || '?'}
                </div>
              )}
            </div>
            <div className={styles.teamInfo}>
              <span className={styles.managerName}>{team2?.manager || 'Unknown'}</span>
              <span className={styles.teamName}>{team2?.name || matchup.team2Name}</span>
            </div>
            <div className={styles.score}>
              {matchup.team2Points.toFixed(2)}
              {team2Won && <span className={styles.winIndicator}>W</span>}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsSection}>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Total Points</span>
            <span className={styles.statValue}>
              {(matchup.team1Points + matchup.team2Points).toFixed(2)}
            </span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Margin of Victory</span>
            <span className={styles.statValue}>
              {isTie ? 'Tie Game!' : pointDiff.toFixed(2)}
            </span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Game Type</span>
            <span className={styles.statValue}>
              {matchup.isConsolation
                ? 'Consolation'
                : matchup.isPlayoff
                  ? 'Playoff'
                  : 'Regular Season'}
            </span>
          </div>
        </div>

        <footer className={styles.footer}>
          <p>Come back tomorrow for a new random matchup!</p>
        </footer>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
