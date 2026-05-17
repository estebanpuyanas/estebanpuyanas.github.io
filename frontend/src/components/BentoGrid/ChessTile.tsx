import type { ReactElement } from "react";
import { useChess, type HeatmapCell } from "../../hooks/useChess";
import type { LichessGame, LichessCurrentGame } from "../../services/lichessService";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const CELL_STRIDE = 13;

function cellColor(cell: HeatmapCell): string {
  if (cell.future) return "transparent";
  if (cell.count === 0) return "var(--bg-3)";
  if (cell.count <= 2) return "var(--chess-heat-1)";
  if (cell.count <= 5) return "var(--chess-heat-2)";
  if (cell.count <= 9) return "var(--chess-heat-3)";
  return "var(--accent)";
}

function getMonthLabels(weeks: HeatmapCell[][]): { idx: number; label: string }[] {
  const out: { idx: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, i) => {
    const m = new Date(week[0].date + "T12:00:00").getMonth();
    if (m !== lastMonth) {
      out.push({ idx: i, label: MONTHS[m] });
      lastMonth = m;
    }
  });
  return out;
}

/* ── Time-control icons ─────────────────────────────────────── */

function BulletIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
      <ellipse cx="12" cy="6" rx="4" ry="5" />
      <path d="M8 10 Q7 14 8 17 Q10 21 12 21 Q14 21 16 17 Q17 14 16 10 Z" />
      <rect x="10" y="20" width="4" height="2" rx="1" />
    </svg>
  );
}

function BlitzIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
      <path d="M13 2 L5 13 h6 L9 22 L19 11 h-6 Z" />
    </svg>
  );
}

function RapidIcon() {
  return (
    <svg viewBox="0 0 32 32" width="14" height="14" fill="currentColor" aria-hidden="true">
      <ellipse cx="14" cy="18" rx="10" ry="7" />
      <circle cx="24" cy="14" r="5" />
      <circle cx="25.5" cy="13" r="1" fill="var(--bg-2)" />
      <ellipse cx="26" cy="9" rx="2" ry="4" />
      <ellipse cx="8"  cy="24" rx="2.5" ry="4" transform="rotate(-15 8 24)" />
      <ellipse cx="14" cy="25" rx="2.5" ry="4" transform="rotate(5 14 25)" />
      <ellipse cx="20" cy="24" rx="2.5" ry="4" transform="rotate(15 20 24)" />
      <circle cx="4" cy="17" r="3" />
    </svg>
  );
}

function ClassicalIcon() {
  return (
    <svg viewBox="0 0 32 32" width="14" height="14" fill="currentColor" aria-hidden="true">
      <path d="M7 17 Q7 8 16 8 Q25 8 25 17 Z" />
      <line x1="16" y1="8" x2="16" y2="17" stroke="var(--bg-2)" strokeWidth="1.2" />
      <line x1="10" y1="9.5" x2="13" y2="17" stroke="var(--bg-2)" strokeWidth="1.2" />
      <line x1="22" y1="9.5" x2="19" y2="17" stroke="var(--bg-2)" strokeWidth="1.2" />
      <path d="M5 17 Q5 22 16 22 Q27 22 27 17 Z" />
      <ellipse cx="25" cy="19" rx="4" ry="3" />
      <circle cx="27" cy="18.5" r="0.9" fill="var(--bg-2)" />
      <rect x="22" y="21" width="3" height="5" rx="1.5" />
      <rect x="8"  y="21" width="3" height="5" rx="1.5" />
      <path d="M6 19 Q3 17 4 14" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function PuzzleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
      <path d="M4 4 h6 v2 a2 2 0 0 0 4 0 v-2 h6 v6 h-2 a2 2 0 0 0 0 4 h2 v6 h-6 v-2 a2 2 0 0 0-4 0 v2 H4 v-6 h2 a2 2 0 0 0 0-4 H4 Z" />
    </svg>
  );
}

const PERF_DISPLAY: {
  key: keyof NonNullable<ReturnType<typeof useChess>["user"]>["perfs"];
  label: string;
  Icon: () => ReactElement;
}[] = [
  { key: "bullet",    label: "Bullet",    Icon: BulletIcon },
  { key: "blitz",     label: "Blitz",     Icon: BlitzIcon },
  { key: "rapid",     label: "Rapid",     Icon: RapidIcon },
  { key: "classical", label: "Classical", Icon: ClassicalIcon },
  { key: "puzzle",    label: "Puzzle",    Icon: PuzzleIcon },
];

/* ── Game helpers ───────────────────────────────────────────── */

function gameResult(game: LichessGame, username: string): "win" | "loss" | "draw" {
  if (!game.winner) return "draw";
  const myColor = game.players.white.user?.id === username ? "white" : "black";
  return game.winner === myColor ? "win" : "loss";
}

function opponent(game: LichessGame, username: string): string {
  const isWhite = game.players.white.user?.id === username;
  const opp = isWhite ? game.players.black : game.players.white;
  return opp.user?.name ?? "Anon";
}

/* ── Game card (vertical, one per completed game) ───────────── */

function GameCard({ game, username }: { game: LichessGame; username: string }) {
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
      <span className={`bento-game-result bento-game-result--${result}`}>
        {result === "win" ? "W" : result === "loss" ? "L" : "D"}
      </span>
      <span className="bento-game-speed">{game.speed}</span>
      <span className="bento-game-opening">{opening}</span>
      <span className="bento-game-opp">vs {opp}</span>
    </a>
  );
}

function LiveGameCard({
  game,
  username,
}: {
  game: LichessCurrentGame;
  username: string;
}) {
  const opp = opponent(game, username);

  return (
    <a
      href={`https://lichess.org/${game.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="bento-game-card bento-game-card--live"
    >
      <span className="bento-game-live-pip" />
      <span className="bento-game-live-label">live</span>
      <span className="bento-game-speed">{game.speed}</span>
      <span className="bento-game-opp">vs {opp}</span>
    </a>
  );
}

const VITE_USERNAME = import.meta.env.VITE_LICHESS_USERNAME as string;

export default function ChessTile() {
  const { user, heatmap, recentGames, currentGame, loading, error } = useChess();
  const labels = heatmap.length ? getMonthLabels(heatmap) : [];

  // Live game replaces the most recent completed game slot
  const displayGames: Array<LichessGame | (LichessCurrentGame & { _live: true })> =
    currentGame
      ? [{ ...currentGame, _live: true as const }, ...recentGames.slice(1)]
      : recentGames;

  return (
    <div className="bento-tile bento-chess">

      {/* ── Top body: heatmap + game cards side-by-side ── */}
      <div className="bento-chess-body">

        {/* Left: heatmap section */}
        <div className="bento-chess-heatmap-section">
          <div className="bento-chess-heatmap-header">
            <span className="bento-label" style={{ padding: 0 }}>// chess</span>
            {!loading && !error && user && (
              <span className="bento-chess-total">
                {user.count.all.toLocaleString()}g
              </span>
            )}
          </div>

          <div className="bento-heatmap-scroll">
            <div className="bento-heatmap-layout">
              <div className="bento-heatmap-days">
                {["M", "", "W", "", "F", "", ""].map((d, i) => (
                  <span key={i} className="bento-heatmap-day">{d}</span>
                ))}
              </div>

              <div className="bento-heatmap-weeks-col">
                <div className="bento-heatmap-months">
                  {labels.map(({ idx, label }) => (
                    <span
                      key={idx}
                      className="bento-heatmap-month"
                      style={{ left: `${idx * CELL_STRIDE}px` }}
                    >
                      {label}
                    </span>
                  ))}
                </div>

                <div className="bento-heatmap-grid">
                  {(loading
                    ? Array.from({ length: 53 }, () =>
                        Array.from({ length: 7 }, (_, d) => ({
                          date: "", count: 0, future: false, skeleton: true, _d: d,
                        }))
                      )
                    : heatmap
                  ).map((week, wi) => (
                    <div key={wi} className="bento-heatmap-week">
                      {week.map((cell, di) => (
                        <div
                          key={di}
                          className={`bento-heatmap-cell${"skeleton" in cell && cell.skeleton ? " bento-heatmap-cell--skeleton" : ""}`}
                          style={
                            "skeleton" in cell && cell.skeleton
                              ? undefined
                              : { background: cellColor(cell as HeatmapCell) }
                          }
                          title={
                            "skeleton" in cell || (cell as HeatmapCell).future
                              ? undefined
                              : `${(cell as HeatmapCell).date}: ${(cell as HeatmapCell).count} game${(cell as HeatmapCell).count !== 1 ? "s" : ""}`
                          }
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: 5 game cards, horizontal */}
        <div className="bento-games">
          <span className="bento-games-header">recent games</span>
          <div className="bento-games-row">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bento-game-card bento-game-card--skeleton" />
                ))
              : displayGames.map((g, i) =>
                  "_live" in g ? (
                    <LiveGameCard key="live" game={g} username={VITE_USERNAME} />
                  ) : (
                    <GameCard key={g.id ?? i} game={g} username={VITE_USERNAME} />
                  ),
                )}
          </div>
        </div>
      </div>

      {/* ── Bottom: ratings full-width ── */}
      <div className="bento-ratings">
        {PERF_DISPLAY.map(({ key, label, Icon }) => {
          const perf = user?.perfs[key];
          return (
            <div key={key} className="bento-rating-card">
              <span className="bento-rating-icon"><Icon /></span>
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
