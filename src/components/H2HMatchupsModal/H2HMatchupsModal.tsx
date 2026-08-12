import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { getHeadToHeadMatchups } from '../../utils/headToHead';
import type { LeagueId } from '../../types';
import styles from './H2HMatchupsModal.module.scss';

interface H2HMatchupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  leagueId: LeagueId;
  managerName: string;
  opponentName: string;
  playoffsOnly?: boolean;
}

export function H2HMatchupsModal({
  isOpen,
  onClose,
  leagueId,
  managerName,
  opponentName,
  playoffsOnly = false,
}: H2HMatchupsModalProps) {
  const games = useMemo(
    () =>
      isOpen
        ? getHeadToHeadMatchups(managerName, opponentName, leagueId, {
            playoffsOnly,
          })
        : [],
    [isOpen, managerName, opponentName, leagueId, playoffsOnly]
  );

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

  const wins = games.filter((g) => g.result === 'W').length;
  const losses = games.filter((g) => g.result === 'L').length;
  const ties = games.filter((g) => g.result === 'T').length;
  const record = ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;

  const modal = (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="h2h-matchups-title"
      >
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <header className={styles.header}>
          <h2 id="h2h-matchups-title">
            {managerName} vs {opponentName}
          </h2>
          <p>
            {record} in {games.length} {playoffsOnly ? 'playoff ' : ''}
            game{games.length === 1 ? '' : 's'}
          </p>
        </header>

        {games.length === 0 ? (
          <p className={styles.empty}>No matchups found.</p>
        ) : (
          <ul className={styles.list}>
            {games.map((game) => (
              <li key={`${game.year}-${game.week}-${game.theirTeamId}`}>
                <Link
                  to={`/${leagueId}/season/${game.year}/matchup/${game.week}/${game.matchupTeam1Id}`}
                  className={`${styles.game} ${styles[game.result.toLowerCase()]}`}
                  onClick={onClose}
                >
                  <div className={styles.meta}>
                    <span className={styles.when}>
                      {game.year} · Week {game.week}
                    </span>
                    {game.isPlayoff && (
                      <span className={styles.playoff}>Playoff</span>
                    )}
                  </div>
                  <div className={styles.scoreRow}>
                    <span className={styles.result}>{game.result}</span>
                    <span className={styles.score}>
                      {game.myPoints.toFixed(2)} – {game.theirPoints.toFixed(2)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
