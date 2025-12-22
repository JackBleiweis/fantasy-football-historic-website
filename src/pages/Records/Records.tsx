import { useParams, Navigate } from 'react-router-dom';
import { getSeasonData, getAvailableYears, isValidLeague } from '../../data';
import { createTeamLookup } from '../../utils/teamUtils';
import { ManagerBadge } from '../../components/ManagerBadge/ManagerBadge';
import styles from './Records.module.scss';

export function Records() {
  const { leagueId } = useParams<{ leagueId: string }>();

  // Validate league ID
  if (!leagueId || !isValidLeague(leagueId)) {
    return <Navigate to="/" replace />;
  }

  const availableYears = getAvailableYears(leagueId);

  // Get all season data for records calculations
  const allSeasons = availableYears
    .map((year) => getSeasonData(leagueId, year))
    .filter(Boolean);

  if (allSeasons.length === 0) {
    return (
      <div className={styles.records}>
        <h1>All-Time Records</h1>
        <p className={styles.noData}>No records data available.</p>
      </div>
    );
  }

  // Calculate all-time high score (single game)
  let highScore = { points: 0, manager: '', teamName: '', week: 0, year: 0 };
  let lowScore = {
    points: Infinity,
    manager: '',
    teamName: '',
    week: 0,
    year: 0,
  };

  allSeasons.forEach((season) => {
    if (!season) return;
    const teamLookup = createTeamLookup(season.teams);

    season.matchups
      .filter((m) => m.isComplete && !m.isPlayoff && !m.isConsolation)
      .forEach((matchup) => {
        const team1 = teamLookup.get(matchup.team1Id);
        const team2 = teamLookup.get(matchup.team2Id);

        if (matchup.team1Points > highScore.points) {
          highScore = {
            points: matchup.team1Points,
            manager: team1?.manager ?? '',
            teamName: matchup.team1Name,
            week: matchup.week,
            year: season.year,
          };
        }
        if (matchup.team2Points > highScore.points) {
          highScore = {
            points: matchup.team2Points,
            manager: team2?.manager ?? '',
            teamName: matchup.team2Name,
            week: matchup.week,
            year: season.year,
          };
        }
        if (matchup.team1Points < lowScore.points && matchup.team1Points > 0) {
          lowScore = {
            points: matchup.team1Points,
            manager: team1?.manager ?? '',
            teamName: matchup.team1Name,
            week: matchup.week,
            year: season.year,
          };
        }
        if (matchup.team2Points < lowScore.points && matchup.team2Points > 0) {
          lowScore = {
            points: matchup.team2Points,
            manager: team2?.manager ?? '',
            teamName: matchup.team2Name,
            week: matchup.week,
            year: season.year,
          };
        }
      });
  });

  // Calculate biggest blowout
  let biggestBlowout = {
    margin: 0,
    winnerManager: '',
    winner: '',
    loserManager: '',
    loser: '',
    week: 0,
    year: 0,
  };
  allSeasons.forEach((season) => {
    if (!season) return;
    const teamLookup = createTeamLookup(season.teams);

    season.matchups
      .filter((m) => m.isComplete)
      .forEach((matchup) => {
        const margin = Math.abs(matchup.team1Points - matchup.team2Points);
        if (margin > biggestBlowout.margin) {
          const winnerIs1 = matchup.team1Points > matchup.team2Points;
          const team1 = teamLookup.get(matchup.team1Id);
          const team2 = teamLookup.get(matchup.team2Id);

          biggestBlowout = {
            margin,
            winnerManager: winnerIs1
              ? (team1?.manager ?? '')
              : (team2?.manager ?? ''),
            winner: winnerIs1 ? matchup.team1Name : matchup.team2Name,
            loserManager: winnerIs1
              ? (team2?.manager ?? '')
              : (team1?.manager ?? ''),
            loser: winnerIs1 ? matchup.team2Name : matchup.team1Name,
            week: matchup.week,
            year: season.year,
          };
        }
      });
  });

  return (
    <div className={styles.records}>
      <h1>All-Time Records</h1>

      <div className={styles.recordsGrid}>
        <div className={styles.recordCard}>
          <h3>Highest Score</h3>
          <div className={styles.recordValue}>
            {highScore.points.toFixed(2)}
          </div>
          <div className={styles.recordDetails}>
            {highScore.manager && (
              <ManagerBadge
                name={highScore.manager}
                size="md"
                leagueId={leagueId}
              />
            )}
            <span className={styles.teamName}>{highScore.teamName}</span>
            <span className={styles.meta}>
              Week {highScore.week}, {highScore.year}
            </span>
          </div>
        </div>

        <div className={styles.recordCard}>
          <h3>Lowest Score</h3>
          <div className={styles.recordValue}>
            {lowScore.points === Infinity ? '-' : lowScore.points.toFixed(2)}
          </div>
          <div className={styles.recordDetails}>
            {lowScore.manager && (
              <ManagerBadge
                name={lowScore.manager}
                size="md"
                leagueId={leagueId}
              />
            )}
            <span className={styles.teamName}>{lowScore.teamName}</span>
            <span className={styles.meta}>
              Week {lowScore.week}, {lowScore.year}
            </span>
          </div>
        </div>

        <div className={styles.recordCard}>
          <h3>Biggest Blowout</h3>
          <div className={styles.recordValue}>
            {biggestBlowout.margin.toFixed(2)} pts
          </div>
          <div className={styles.recordDetails}>
            <div className={styles.blowoutManagers}>
              {biggestBlowout.winnerManager && (
                <ManagerBadge
                  name={biggestBlowout.winnerManager}
                  size="sm"
                  leagueId={leagueId}
                />
              )}
              <span className={styles.vs}>def.</span>
              {biggestBlowout.loserManager && (
                <ManagerBadge
                  name={biggestBlowout.loserManager}
                  size="sm"
                  leagueId={leagueId}
                />
              )}
            </div>
            <span className={styles.meta}>
              Week {biggestBlowout.week}, {biggestBlowout.year}
            </span>
          </div>
        </div>

        <div className={styles.recordCard}>
          <h3>Seasons Tracked</h3>
          <div className={styles.recordValue}>{availableYears.length}</div>
          <div className={styles.recordDetails}>
            <span className={styles.meta}>
              {availableYears[availableYears.length - 1]} - {availableYears[0]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
