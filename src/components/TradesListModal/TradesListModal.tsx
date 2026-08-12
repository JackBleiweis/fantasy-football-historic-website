import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ManagerBadge } from '../ManagerBadge/ManagerBadge';
import type { LeagueId, Trade } from '../../types';
import styles from './TradesListModal.module.scss';

interface TradesListModalProps {
  isOpen: boolean;
  onClose: () => void;
  leagueId: LeagueId;
  manager: string;
  year: number;
  trades: Trade[];
}

export function TradesListModal({
  isOpen,
  onClose,
  leagueId,
  manager,
  year,
  trades,
}: TradesListModalProps) {
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

  const modal = (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="trades-list-title"
      >
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <header className={styles.header}>
          <h2 id="trades-list-title">
            {manager} · {year} trades
          </h2>
          <p>
            {trades.length} trade{trades.length === 1 ? '' : 's'}
          </p>
        </header>

        {trades.length === 0 ? (
          <p className={styles.empty}>No trade details available.</p>
        ) : (
          <ul className={styles.list}>
            {trades.map((trade) => {
              const dateLabel = trade.date
                ? new Date(trade.date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : null;
              return (
                <li key={trade.id} className={styles.trade}>
                  {dateLabel && <span className={styles.date}>{dateLabel}</span>}
                  <div className={styles.sides}>
                    {trade.sides.map((side) => (
                      <article key={`${trade.id}-${side.teamId}`}>
                        {side.manager ? (
                          <ManagerBadge
                            name={side.manager}
                            size="sm"
                            leagueId={leagueId}
                          />
                        ) : (
                          <strong>{side.teamName}</strong>
                        )}
                        <p>
                          <span>Gave</span> {side.sent.join(', ') || '—'}
                        </p>
                        <p>
                          <span>Got</span> {side.received.join(', ') || '—'}
                        </p>
                      </article>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
