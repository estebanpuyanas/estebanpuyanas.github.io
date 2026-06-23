import type { ReactElement } from "react";
import { ActivityCalendar } from "react-activity-calendar";
import { useChess } from "../../hooks/useChess";
import type { LichessGame } from "../../services/lichessService";

// CSS variables used here adapt to light/dark via [data-theme] in index.css.
// Both arrays are identical so the resolved CSS var is always correct regardless
// of which colorScheme branch the library picks internally.
const CALENDAR_THEME = {
  dark: [
    "var(--bg-3)",
    "var(--chess-heat-1)",
    "var(--chess-heat-2)",
    "var(--chess-heat-3)",
    "var(--accent)",
  ] as [string, string, string, string, string],
  light: [
    "var(--bg-3)",
    "var(--chess-heat-1)",
    "var(--chess-heat-2)",
    "var(--chess-heat-3)",
    "var(--accent)",
  ] as [string, string, string, string, string],
};

/* ── Time-control icons ─────────────────────────────────────── */

function BulletIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="currentColor"
      aria-hidden="true"
    >
      <ellipse cx="12" cy="6" rx="4" ry="5" />
      <path d="M8 10 Q7 14 8 17 Q10 21 12 21 Q14 21 16 17 Q17 14 16 10 Z" />
      <rect x="10" y="20" width="4" height="2" rx="1" />
    </svg>
  );
}

function BlitzIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M13 2 L5 13 h6 L9 22 L19 11 h-6 Z" />
    </svg>
  );
}

function RapidIcon() {
  return (
    <svg
      viewBox="0 0 32 32"
      width="14"
      height="14"
      fill="currentColor"
      aria-hidden="true"
    >
      <ellipse cx="14" cy="18" rx="10" ry="7" />
      <circle cx="24" cy="14" r="5" />
      <circle cx="25.5" cy="13" r="1" fill="var(--bg-2)" />
      <ellipse cx="26" cy="9" rx="2" ry="4" />
      <ellipse cx="8" cy="24" rx="2.5" ry="4" transform="rotate(-15 8 24)" />
      <ellipse cx="14" cy="25" rx="2.5" ry="4" transform="rotate(5 14 25)" />
      <ellipse cx="20" cy="24" rx="2.5" ry="4" transform="rotate(15 20 24)" />
      <circle cx="4" cy="17" r="3" />
    </svg>
  );
}

function ClassicalIcon() {
  return (
    <svg
      viewBox="0 0 32 32"
      width="14"
      height="14"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M7 17 Q7 8 16 8 Q25 8 25 17 Z" />
      <line
        x1="16"
        y1="8"
        x2="16"
        y2="17"
        stroke="var(--bg-2)"
        strokeWidth="1.2"
      />
      <line
        x1="10"
        y1="9.5"
        x2="13"
        y2="17"
        stroke="var(--bg-2)"
        strokeWidth="1.2"
      />
      <line
        x1="22"
        y1="9.5"
        x2="19"
        y2="17"
        stroke="var(--bg-2)"
        strokeWidth="1.2"
      />
      <path d="M5 17 Q5 22 16 22 Q27 22 27 17 Z" />
      <ellipse cx="25" cy="19" rx="4" ry="3" />
      <circle cx="27" cy="18.5" r="0.9" fill="var(--bg-2)" />
      <rect x="22" y="21" width="3" height="5" rx="1.5" />
      <rect x="8" y="21" width="3" height="5" rx="1.5" />
      <path
        d="M6 19 Q3 17 4 14"
        strokeWidth="2"
        stroke="currentColor"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PuzzleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M4 4 h6 v2 a2 2 0 0 0 4 0 v-2 h6 v6 h-2 a2 2 0 0 0 0 4 h2 v6 h-6 v-2 a2 2 0 0 0-4 0 v2 H4 v-6 h2 a2 2 0 0 0 0-4 H4 Z" />
    </svg>
  );
}

const PERF_DISPLAY: {
  key: keyof NonNullable<ReturnType<typeof useChess>["user"]>["perfs"];
  label: string;
  Icon: () => ReactElement;
}[] = [
  { key: "bullet", label: "Bullet", Icon: BulletIcon },
  { key: "blitz", label: "Blitz", Icon: BlitzIcon },
  { key: "rapid", label: "Rapid", Icon: RapidIcon },
  { key: "classical", label: "Classical", Icon: ClassicalIcon },
  { key: "puzzle", label: "Puzzle", Icon: PuzzleIcon },
];

/* ── Game helpers ───────────────────────────────────────────── */

function gameResult(
  game: LichessGame,
  username: string,
): "win" | "loss" | "draw" {
  if (!game.winner) return "draw";
  const myColor = game.players.white.user?.id === username ? "white" : "black";
  return game.winner === myColor ? "win" : "loss";
}

function opponent(game: LichessGame, username: string): string {
  const isWhite = game.players.white.user?.id === username;
  const opp = isWhite ? game.players.black : game.players.white;
  return opp.user?.name ?? "Anon";
}

/* ── Game card ──────────────────────────────────────────────── */

function GameCard({
  game,
  username,
  isMostRecent,
}: {
  game: LichessGame;
  username: string;
  isMostRecent: boolean;
}) {
  const result = gameResult(game, username);
  const opp = opponent(game, username);
  const opening = game.opening?.name ?? "—";

  return (
    <a
      href={`https://lichess.org/${game.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="bento-game-card"
    >
      {isMostRecent && (
        <span className="bento-game-recency">most recently played</span>
      )}
      <span className={`bento-game-result bento-game-result--${result}`}>
        {result === "win" ? "W" : result === "loss" ? "L" : "D"}
      </span>
      <span className="bento-game-speed">{game.speed}</span>
      <span className="bento-game-opening">{opening}</span>
      <span className="bento-game-opp">vs {opp}</span>
    </a>
  );
}

const VITE_USERNAME = import.meta.env.VITE_LICHESS_USERNAME as string;

export default function ChessTile() {
  const { user, activityData, recentGames, loading, error } = useChess();

  return (
    <div className="bento-tile bento-chess">
      {/* ── Top body: heatmap + game cards ── */}
      <div className="bento-chess-body">
        {/* Left: activity calendar */}
        <div className="bento-chess-heatmap-section">
          <div className="bento-chess-heatmap-header">
            <span className="bento-label" style={{ padding: 0 }}>
              // chess
            </span>
            {!loading && !error && user && (
              <span className="bento-chess-total">
                {user.count.all.toLocaleString()}g
              </span>
            )}
          </div>

          <div className="bento-heatmap-scroll">
            <ActivityCalendar
              data={activityData}
              loading={loading}
              theme={CALENDAR_THEME}
              colorScheme="dark"
              blockSize={10}
              blockMargin={2}
              blockRadius={2}
              fontSize={10}
              showWeekdayLabels
              showColorLegend={false}
              showTotalCount={false}
              labels={{ weekdays: ["S", "M", "T", "W", "T", "F", "S"] }}
              style={{ fontFamily: "var(--font-mono)" }}
            />
          </div>

          {/* Legend sits outside the scroll wrapper so it can never be clipped by it */}
          <div className="bento-heatmap-footer">
            <span className="bento-heatmap-footer-label">Less</span>
            {([0, 1, 2, 3, 4] as const).map((l) => (
              <span
                key={l}
                className={`bento-heatmap-legend-block bento-heatmap-legend-block--${l}`}
              />
            ))}
            <span className="bento-heatmap-footer-label">More</span>
            <span className="bento-heatmap-footer-spacer" />
            {!loading && !error && (
              <span className="bento-heatmap-footer-label">
                {activityData.reduce((s, d) => s + d.count, 0).toLocaleString()}{" "}
                games this year
              </span>
            )}
          </div>
        </div>

        {/* Right: 5 game cards, horizontal */}
        <div className="bento-games">
          <span className="bento-games-header">recent games</span>
          <div className="bento-games-row">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="bento-game-card bento-game-card--skeleton"
                  />
                ))
              : recentGames.map((g, i) => (
                  <GameCard
                    key={g.id ?? i}
                    game={g}
                    username={VITE_USERNAME}
                    isMostRecent={i === 0}
                  />
                ))}
          </div>
        </div>
      </div>

      {/* ── Bottom: ratings full-width ── */}
      <div className="bento-ratings">
        {PERF_DISPLAY.map(({ key, label, Icon }) => {
          const perf = user?.perfs[key];
          return (
            <div key={key} className="bento-rating-card">
              <span className="bento-rating-icon">
                <Icon />
              </span>
              <span className="bento-rating-label">{label}</span>
              <span className="bento-rating-value">
                {loading ? "—" : (perf?.rating ?? "—")}
              </span>
              {!loading && perf && (
                <>
                  <span className="bento-rating-games">
                    {perf.games.toLocaleString()}g
                  </span>
                  <span
                    className={`bento-rating-prog ${
                      perf.prog > 0
                        ? "bento-rating-prog--up"
                        : perf.prog < 0
                          ? "bento-rating-prog--down"
                          : "bento-rating-prog--flat"
                    }`}
                  >
                    {perf.prog > 0
                      ? `↑ +${perf.prog}`
                      : perf.prog < 0
                        ? `↓ ${perf.prog}`
                        : "—"}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
