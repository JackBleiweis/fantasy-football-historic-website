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
              className={styles.doorContainer}
              data-league={league.id}
            >
              {/* Door frame */}
              <div className={styles.doorFrame}>
                {/* Content behind the door */}
                <div className={styles.doorInside}>
                  <div className={styles.insideContent}>
                    <span className={styles.enterText}>Enter</span>
                    <svg
                      className={styles.enterArrow}
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
                  </div>
                </div>
                
                {/* The door itself */}
                <div className={styles.door}>
                  <div className={styles.doorPanel}>
                    <div className={styles.doorWindow}>
                      <span className={styles.leagueShort}>{league.shortName}</span>
                    </div>
                    <div className={styles.doorInfo}>
                      <h3>{league.name}</h3>
                      <span className={styles.yearsCount}>
                        {league.years.length > 0
                          ? `${league.years.length} seasons`
                          : 'Coming soon'}
                      </span>
                    </div>
                    <div className={styles.doorknob}></div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <footer className={styles.footer}>
        <p>
          Track your league's history and crunch the numbers.
        </p>
      </footer>
    </div>
  );
}
