import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ManagerBadge } from '../ManagerBadge/ManagerBadge';
import type { LeagueId, Trade } from '../../types';
import styles from './TradeModal.module.scss';

interface TradeModalProps {
  trade: Trade;
  leagueId: LeagueId;
  isOpen: boolean;
  onClose: () => void;
}

export function TradeModal({ trade, leagueId, isOpen, onClose }: TradeModalProps) {
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

  const dateLabel = trade.date
    ? new Date(trade.date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : `${trade.year}`;

  const modal = (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          ×
        </button>
        <header>
          <span>🔁 Trade of the Day</span>
          <h2>
            {trade.year} • {dateLabel}
          </h2>
        </header>
        <div className={styles.sides}>
          {trade.sides.map((side) => (
            <article key={side.teamId}>
              {side.manager ? (
                <ManagerBadge name={side.manager} leagueId={leagueId} />
              ) : (
                <strong>{side.teamName}</strong>
              )}
              <p className={styles.sent}>Gave: {side.sent.join(', ') || '—'}</p>
              <p className={styles.got}>Got: {side.received.join(', ') || '—'}</p>
            </article>
          ))}
        </div>
        <footer>Come back tomorrow for a new random trade.</footer>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
