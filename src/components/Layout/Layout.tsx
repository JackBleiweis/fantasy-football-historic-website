import { Outlet, useParams, NavLink, Navigate } from 'react-router-dom';
import { getLeagueInfo, isValidLeague } from '../../data';
import styles from './Layout.module.scss';

export function Layout() {
  const { leagueId } = useParams<{ leagueId: string }>();

  // Validate league ID
  if (!leagueId || !isValidLeague(leagueId)) {
    return <Navigate to="/" replace />;
  }

  const leagueInfo = getLeagueInfo(leagueId);

  if (!leagueInfo) {
    return <Navigate to="/" replace />;
  }

  const navItems = [
    { to: `/${leagueId}`, label: 'Home', end: true },
    { to: `/${leagueId}/managers`, label: 'Managers', end: false },
    { to: `/${leagueId}/drafts`, label: 'Drafts', end: false },
    { to: `/${leagueId}/standings`, label: 'Standings', end: false },
    { to: `/${leagueId}/season`, label: 'Season', end: false },
    { to: `/${leagueId}/playoffs`, label: 'Playoffs', end: false },
    { to: `/${leagueId}/records`, label: 'Records', end: false },
  ];

  return (
    <div className={styles.layout} data-league={leagueId}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.brand}>
            <NavLink to="/" className={styles.backLink}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </NavLink>
            <span className={styles.leagueName}>{leagueInfo.shortName}</span>
          </div>

          <nav className={styles.nav}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.active : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p>Fantasy Football Historic Data</p>
        </div>
      </footer>
    </div>
  );
}
