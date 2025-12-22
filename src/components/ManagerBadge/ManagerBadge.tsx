import { useManagerModal } from '../../contexts/ManagerModalContext';
import { getManagerAvatar } from '../../data/managerAvatars';
import type { LeagueId } from '../../types';
import styles from './ManagerBadge.module.scss';

interface ManagerBadgeProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  leagueId?: LeagueId;
  clickable?: boolean;
}

/**
 * Displays a manager's avatar and name
 * Falls back to initials if no avatar is available
 * Clicking opens the manager profile modal (if leagueId provided)
 */
export function ManagerBadge({
  name,
  size = 'md',
  showName = true,
  leagueId,
  clickable = true,
}: ManagerBadgeProps) {
  const { openModal } = useManagerModal();
  const avatarUrl = getManagerAvatar(name);
  const initials = name.charAt(0).toUpperCase();

  const isClickable = clickable && leagueId;

  const handleClick = () => {
    if (isClickable) {
      openModal(name, leagueId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      openModal(name, leagueId);
    }
  };

  return (
    <span
      className={`${styles.badge} ${styles[size]} ${isClickable ? styles.clickable : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={isClickable ? `View ${name}'s profile` : undefined}
    >
      <span className={styles.avatar}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} />
        ) : (
          <span className={styles.initials}>{initials}</span>
        )}
      </span>
      {showName && <span className={styles.name}>{name}</span>}
    </span>
  );
}
