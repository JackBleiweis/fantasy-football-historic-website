import { Link } from 'react-router-dom';
import { leagues } from '../../data';
import styles from './Home.module.scss';

export function Home() {
  const leagueList = Object.values(leagues);

  return (
    <div className={styles.home}>
      <header className={styles.header}>
        <h1>Fantasy Football</h1>
        <p className={styles.subtitle}>Historic Data & Records</p>
      </header>

      <main className={styles.main}>
        <h2 className={styles.selectTitle}>Select a League</h2>

        <div className={styles.leagueGrid}>
          {leagueList.map((league) => (
            <Link
              key={league.id}
              to={`/${league.id}`}
              className={styles.leagueCard}
              data-league={league.id}
            >
              <div className={styles.leagueIcon}>
                <span>{league.shortName}</span>
              </div>
              <div className={styles.leagueInfo}>
                <h3>{league.name}</h3>
                {league.description && <p>{league.description}</p>}
                <span className={styles.yearsCount}>
                  {league.years.length > 0
                    ? `${league.years.length} season${league.years.length !== 1 ? 's' : ''} of data`
                    : 'Coming soon'}
                </span>
              </div>
              <svg
                className={styles.arrow}
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </main>

      <footer className={styles.footer}>
        <p>
          Track your league's history, relive the glory days, and settle debates
          once and for all.
        </p>
      </footer>
    </div>
  );
}
