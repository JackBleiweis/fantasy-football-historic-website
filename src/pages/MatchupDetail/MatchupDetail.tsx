import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { getSeasonData, isValidLeague } from '../../data';
import { loadWeeklyRosters } from '../../data/rosters';
import { ManagerBadge } from '../../components/ManagerBadge/ManagerBadge';
import type { RosterPlayer, WeeklyRosters } from '../../types';
import styles from './MatchupDetail.module.scss';

function isBench(slot: string) {
  return slot === 'BN' || slot === 'IR' || slot === 'NA';
}

function formatStatLine(statLine: Record<string, number | string>) {
  return Object.entries(statLine)
    .filter(([, value]) => Number(value) !== 0 && value !== '0' && value !== '')
    .map(([key, value]) => `${key} ${value}`)
    .join(' • ');
}

function Lineup({
  title,
  players,
  points,
}: {
  title: string;
  players: RosterPlayer[];
  points: number;
}) {
  const starters = players.filter((p) => !isBench(p.slot));
  const bench = players.filter((p) => isBench(p.slot));

  return (
    <section className={styles.lineup}>
      <header>
        <h2>{title}</h2>
        <span>{points.toFixed(2)}</span>
      </header>
      <table>
        <thead>
          <tr>
            <th>Slot</th>
            <th>Player</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {starters.map((player, index) => (
            <tr key={`${player.slot}-${player.name}-${index}`}>
              <td>{player.slot}</td>
              <td>
                <div className={styles.player}>
                  <strong>
                    {player.name}{' '}
                    <span className={styles.pos}>{player.position}</span>
                  </strong>
                  <span className={styles.stats}>{formatStatLine(player.statLine)}</span>
                </div>
              </td>
              <td>{player.points.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {bench.length > 0 && (
        <>
          <h3>Bench</h3>
          <table>
            <tbody>
              {bench.map((player, index) => (
                <tr key={`bn-${player.name}-${index}`} className={styles.bench}>
                  <td>{player.slot}</td>
                  <td>
                    <div className={styles.player}>
                      <strong>
                        {player.name}{' '}
                        <span className={styles.pos}>{player.position}</span>
                      </strong>
                      <span className={styles.stats}>{formatStatLine(player.statLine)}</span>
                    </div>
                  </td>
                  <td>{player.points.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}

export function MatchupDetail() {
  const { leagueId, year, week, team1Id } = useParams<{
    leagueId: string;
    year: string;
    week: string;
    team1Id: string;
  }>();
  const validLeagueId = leagueId && isValidLeague(leagueId) ? leagueId : null;
  const selectedYear = year ? parseInt(year, 10) : NaN;
  const selectedWeek = week ? parseInt(week, 10) : NaN;
  const seasonData =
    validLeagueId && selectedYear
      ? getSeasonData(validLeagueId, selectedYear)
      : null;
  const matchup = seasonData?.matchups.find(
    (m) => m.week === selectedWeek && m.team1Id === team1Id
  );

  const [rosters, setRosters] = useState<WeeklyRosters | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!validLeagueId || !selectedYear) return;
    loadWeeklyRosters(validLeagueId, selectedYear).then((data) => {
      if (!cancelled) setRosters(data);
    });
    return () => {
      cancelled = true;
    };
  }, [validLeagueId, selectedYear]);

  const team1 = seasonData?.teams.find((t) => t.id === matchup?.team1Id);
  const team2 = seasonData?.teams.find((t) => t.id === matchup?.team2Id);
  const weekRosters = rosters?.weeks?.[selectedWeek] || [];
  const team1Players = weekRosters.find((t) => t.teamId === matchup?.team1Id)?.players || [];
  const team2Players = weekRosters.find((t) => t.teamId === matchup?.team2Id)?.players || [];

  if (!validLeagueId) return <Navigate to="/" replace />;
  if (!seasonData || !matchup) {
    return (
      <div className={styles.page}>
        <p>Matchup not found.</p>
        <Link to={`/${validLeagueId}/season`}>Back to season</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link className={styles.back} to={`/${validLeagueId}/season/${selectedYear}`}>
        ← {selectedYear} season
      </Link>
      <header className={styles.header}>
        <p>
          Week {matchup.week}
          {matchup.isPlayoff ? ' • Playoff' : ''}
          {matchup.isConsolation ? ' • Consolation' : ''}
        </p>
        <div className={styles.scoreboard}>
          <div>
            {team1 && <ManagerBadge name={team1.manager} leagueId={validLeagueId} />}
            <strong>{matchup.team1Points.toFixed(2)}</strong>
          </div>
          <span>vs</span>
          <div>
            {team2 && <ManagerBadge name={team2.manager} leagueId={validLeagueId} />}
            <strong>{matchup.team2Points.toFixed(2)}</strong>
          </div>
        </div>
      </header>

      {team1Players.length > 0 || team2Players.length > 0 ? (
        <div className={styles.lineups}>
          <Lineup
            title={team1?.manager || matchup.team1Name}
            players={team1Players}
            points={matchup.team1Points}
          />
          <Lineup
            title={team2?.manager || matchup.team2Name}
            players={team2Players}
            points={matchup.team2Points}
          />
        </div>
      ) : (
        <p className={styles.fallback}>
          Lineups and stat lines are not available for this season yet. The
          score above is still official.
        </p>
      )}
    </div>
  );
}
