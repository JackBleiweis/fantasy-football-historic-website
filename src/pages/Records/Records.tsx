import { useMemo, useState, type ReactNode } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { isValidLeague } from '../../data';
import { ManagerBadge } from '../../components/ManagerBadge/ManagerBadge';
import { TradesListModal } from '../../components/TradesListModal/TradesListModal';
import {
  computeLeagueRecords,
  getTradesForManagerSeason,
  type ManagerCareerMark,
  type ManagerSeasonMark,
  type MatchupMark,
} from '../../utils/leagueRecords';
import type { LeagueId } from '../../types';
import styles from './Records.module.scss';

function MatchupMeta({
  mark,
  leagueId,
  mode,
}: {
  mark: MatchupMark;
  leagueId: LeagueId;
  mode: 'single' | 'vs' | 'combined';
}) {
  if (mode === 'single') {
    return (
      <>
        {mark.manager1 && (
          <ManagerBadge name={mark.manager1} size="md" leagueId={leagueId} />
        )}
        <span className={styles.teamName}>{mark.team1}</span>
        <span className={styles.meta}>
          Week {mark.week}, {mark.year}
        </span>
      </>
    );
  }

  return (
    <>
      <div className={styles.blowoutManagers}>
        {mark.manager1 && (
          <ManagerBadge name={mark.manager1} size="sm" leagueId={leagueId} />
        )}
        <span className={styles.vs}>{mode === 'combined' ? '+' : 'def.'}</span>
        {mark.manager2 && (
          <ManagerBadge name={mark.manager2} size="sm" leagueId={leagueId} />
        )}
      </div>
      {mode === 'combined' && (
        <span className={styles.teamName}>
          {mark.points1.toFixed(1)} + {mark.points2.toFixed(1)}
        </span>
      )}
      <span className={styles.meta}>
        Week {mark.week}, {mark.year}
      </span>
    </>
  );
}

function SeasonMeta({
  mark,
  leagueId,
}: {
  mark: ManagerSeasonMark;
  leagueId: LeagueId;
}) {
  return (
    <>
      <ManagerBadge name={mark.manager} size="md" leagueId={leagueId} />
      <span className={styles.teamName}>{mark.teamName}</span>
      <span className={styles.meta}>{mark.year}</span>
    </>
  );
}

function CareerMeta({
  mark,
  leagueId,
}: {
  mark: ManagerCareerMark;
  leagueId: LeagueId;
}) {
  return (
    <>
      <ManagerBadge name={mark.manager} size="md" leagueId={leagueId} />
      {mark.seasons != null && (
        <span className={styles.meta}>
          across {mark.seasons} season{mark.seasons === 1 ? '' : 's'}
        </span>
      )}
    </>
  );
}

function RecordCard({
  title,
  value,
  children,
  onClick,
  actionLabel,
  largeText,
}: {
  title: string;
  value: string;
  children?: ReactNode;
  onClick?: () => void;
  actionLabel?: string;
  largeText?: boolean;
}) {
  const clickable = !!onClick;
  const Comp = clickable ? 'button' : 'div';

  return (
    <Comp
      type={clickable ? 'button' : undefined}
      className={`${styles.recordCard} ${clickable ? styles.clickable : ''}`}
      onClick={onClick}
    >
      <h3>{title}</h3>
      <div
        className={`${styles.recordValue} ${largeText ? styles.recordValueText : ''}`}
      >
        {value}
      </div>
      <div className={styles.recordDetails}>{children}</div>
      {clickable && actionLabel && (
        <span className={styles.cardAction}>{actionLabel}</span>
      )}
    </Comp>
  );
}

export function Records() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const validLeagueId = leagueId && isValidLeague(leagueId) ? leagueId : null;
  const records = useMemo(
    () => (validLeagueId ? computeLeagueRecords(validLeagueId) : null),
    [validLeagueId]
  );
  const [tradeViewer, setTradeViewer] = useState<{
    manager: string;
    year: number;
  } | null>(null);

  const tradeList = useMemo(() => {
    if (!validLeagueId || !tradeViewer) return [];
    return getTradesForManagerSeason(
      validLeagueId,
      tradeViewer.year,
      tradeViewer.manager
    );
  }, [validLeagueId, tradeViewer]);

  if (!validLeagueId || !records) {
    return <Navigate to="/" replace />;
  }

  if (records.seasonsTracked === 0) {
    return (
      <div className={styles.records}>
        <h1>All-Time Records</h1>
        <p className={styles.noData}>No records data available.</p>
      </div>
    );
  }

  const r = records;

  return (
    <div className={styles.records}>
      <header className={styles.pageHeader}>
        <h1>All-Time Records</h1>
        <p>
          {r.seasonsTracked} seasons · {r.yearRange}
        </p>
      </header>

      <section className={styles.section}>
        <h2>Scoring</h2>
        <div className={styles.recordsGrid}>
          {r.highScore && (
            <RecordCard title="Highest Score" value={r.highScore.value.toFixed(2)}>
              <MatchupMeta mark={r.highScore} leagueId={validLeagueId} mode="single" />
            </RecordCard>
          )}
          {r.lowScore && (
            <RecordCard title="Lowest Score" value={r.lowScore.value.toFixed(2)}>
              <MatchupMeta mark={r.lowScore} leagueId={validLeagueId} mode="single" />
            </RecordCard>
          )}
          {r.highestSeasonPF && (
            <RecordCard
              title="Most Points in a Season"
              value={r.highestSeasonPF.value.toFixed(1)}
            >
              <SeasonMeta mark={r.highestSeasonPF} leagueId={validLeagueId} />
            </RecordCard>
          )}
          {r.lowestSeasonPF && (
            <RecordCard
              title="Fewest Points in a Season"
              value={r.lowestSeasonPF.value.toFixed(1)}
            >
              <SeasonMeta mark={r.lowestSeasonPF} leagueId={validLeagueId} />
            </RecordCard>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Matchups</h2>
        <div className={styles.recordsGrid}>
          {r.biggestBlowout && (
            <RecordCard
              title="Biggest Blowout"
              value={`${r.biggestBlowout.value.toFixed(2)} pts`}
            >
              <MatchupMeta
                mark={r.biggestBlowout}
                leagueId={validLeagueId}
                mode="vs"
              />
            </RecordCard>
          )}
          {r.closestGame && (
            <RecordCard
              title="Narrowest Win"
              value={`${r.closestGame.value.toFixed(2)} pts`}
            >
              <MatchupMeta
                mark={r.closestGame}
                leagueId={validLeagueId}
                mode="vs"
              />
            </RecordCard>
          )}
          {r.highestCombined && (
            <RecordCard
              title="Highest Scoring Matchup"
              value={r.highestCombined.value.toFixed(1)}
            >
              <MatchupMeta
                mark={r.highestCombined}
                leagueId={validLeagueId}
                mode="combined"
              />
            </RecordCard>
          )}
          {r.longestWinStreak && (
            <RecordCard
              title="Longest Win Streak"
              value={`${r.longestWinStreak.value}`}
            >
              <SeasonMeta mark={r.longestWinStreak} leagueId={validLeagueId} />
              <span className={styles.meta}>regular season games</span>
            </RecordCard>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Season marks</h2>
        <div className={styles.recordsGrid}>
          {r.mostWinsSeason && (
            <RecordCard
              title="Most Wins in a Season"
              value={`${r.mostWinsSeason.value}`}
            >
              <SeasonMeta mark={r.mostWinsSeason} leagueId={validLeagueId} />
            </RecordCard>
          )}
          {r.fewestWinsSeason && (
            <RecordCard
              title="Fewest Wins in a Season"
              value={`${r.fewestWinsSeason.value}`}
            >
              <SeasonMeta mark={r.fewestWinsSeason} leagueId={validLeagueId} />
            </RecordCard>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Activity</h2>
        <div className={styles.recordsGrid}>
          {r.mostTradesSeason && (
            <RecordCard
              title="Most Trades in a Season"
              value={`${r.mostTradesSeason.value}`}
              onClick={() =>
                setTradeViewer({
                  manager: r.mostTradesSeason!.manager,
                  year: r.mostTradesSeason!.year,
                })
              }
              actionLabel="View trades"
            >
              <SeasonMeta mark={r.mostTradesSeason} leagueId={validLeagueId} />
            </RecordCard>
          )}
          {r.mostMovesSeason && (
            <RecordCard
              title="Most Roster Moves in a Season"
              value={`${r.mostMovesSeason.value}`}
            >
              <SeasonMeta mark={r.mostMovesSeason} leagueId={validLeagueId} />
            </RecordCard>
          )}
          {r.mostTradesCareer && (
            <RecordCard
              title="Most Trades All-Time"
              value={`${r.mostTradesCareer.value}`}
            >
              <CareerMeta mark={r.mostTradesCareer} leagueId={validLeagueId} />
            </RecordCard>
          )}
          {r.mostMovesCareer && (
            <RecordCard
              title="Most Roster Moves All-Time"
              value={`${r.mostMovesCareer.value}`}
            >
              <CareerMeta mark={r.mostMovesCareer} leagueId={validLeagueId} />
            </RecordCard>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Titles & playoffs</h2>
        <div className={styles.recordsGrid}>
          {r.mostChampionships && (
            <RecordCard
              title="Most Championships"
              value={`${r.mostChampionships.value}`}
            >
              <CareerMeta
                mark={r.mostChampionships}
                leagueId={validLeagueId}
              />
            </RecordCard>
          )}
          {r.mostFinals && (
            <RecordCard title="Most Finals Appearances" value={`${r.mostFinals.value}`}>
              <CareerMeta mark={r.mostFinals} leagueId={validLeagueId} />
            </RecordCard>
          )}
          {r.mostPlayoffAppearances && (
            <RecordCard
              title="Most Playoff Appearances"
              value={`${r.mostPlayoffAppearances.value}`}
            >
              <CareerMeta
                mark={r.mostPlayoffAppearances}
                leagueId={validLeagueId}
              />
            </RecordCard>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Culture</h2>
        <div className={styles.recordsGrid}>
          {r.bestTeamName && (
            <RecordCard
              title="Best Fantasy Team Name"
              value={r.bestTeamName.teamName}
              largeText
            >
              <ManagerBadge
                name={r.bestTeamName.manager}
                size="md"
                leagueId={validLeagueId}
              />
              <span className={styles.meta}>
                {r.bestTeamName.year}
                {r.bestTeamName.note ? ` · ${r.bestTeamName.note}` : ''}
              </span>
            </RecordCard>
          )}
        </div>
      </section>

      {tradeViewer && (
        <TradesListModal
          isOpen
          onClose={() => setTradeViewer(null)}
          leagueId={validLeagueId}
          manager={tradeViewer.manager}
          year={tradeViewer.year}
          trades={tradeList}
        />
      )}
    </div>
  );
}
