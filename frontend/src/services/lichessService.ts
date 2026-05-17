const LICHESS_BASE = import.meta.env.VITE_LICHESS_BASE as string;
const USERNAME = import.meta.env.VITE_LICHESS_USERNAME as string;

export interface LichessPerf {
  games: number;
  rating: number;
  rd: number;
  prog: number;
  prov?: boolean;
}

export interface LichessUser {
  perfs: {
    bullet?: LichessPerf;
    blitz?: LichessPerf;
    rapid?: LichessPerf;
    classical?: LichessPerf;
    puzzle?: LichessPerf;
  };
  count: {
    all: number;
    rated: number;
    win: number;
    loss: number;
    draw: number;
  };
}

export interface LichessActivityDay {
  date: string;
  games: number;
}

export async function getLichessUser(): Promise<LichessUser> {
  const res = await fetch(`${LICHESS_BASE}/user/${USERNAME}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Lichess user fetch failed: ${res.status}`);
  return res.json();
}

export interface LichessGame {
  id: string;
  speed: string;
  perf: string;
  createdAt: number;
  status: string;
  winner?: "white" | "black";
  opening?: { name: string };
  players: {
    white: { user?: { name: string; id: string }; rating?: number };
    black: { user?: { name: string; id: string }; rating?: number };
  };
}

export interface LichessCurrentGame extends LichessGame {
  isMyTurn?: boolean;
}

export async function getLichessRecentGames(max = 5): Promise<LichessGame[]> {
  const res = await fetch(
    `${LICHESS_BASE}/games/user/${USERNAME}?max=${max}&opening=true`,
    { headers: { Accept: "application/x-ndjson" } },
  );
  if (!res.ok) throw new Error(`Lichess games fetch failed: ${res.status}`);
  const text = await res.text();
  return text
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as LichessGame);
}

export async function getLichessCurrentGame(): Promise<LichessCurrentGame | null> {
  const res = await fetch(`${LICHESS_BASE}/user/${USERNAME}/current-game`, {
    headers: { Accept: "application/json" },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Lichess current game fetch failed: ${res.status}`);
  const text = await res.text();
  if (!text.trim()) return null;
  return JSON.parse(text) as LichessCurrentGame;
}

export async function getLichessActivity(): Promise<LichessActivityDay[]> {
  const res = await fetch(`${LICHESS_BASE}/user/${USERNAME}/activity`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Lichess activity fetch failed: ${res.status}`);

  const raw: Array<{
    interval: { start: number };
    games?: Record<string, { win?: number; loss?: number; draw?: number }>;
  }> = await res.json();

  return raw.map((item) => {
    const games = item.games ?? {};
    const total = Object.values(games).reduce(
      (sum, g) => sum + (g.win ?? 0) + (g.loss ?? 0) + (g.draw ?? 0),
      0,
    );
    return {
      date: new Date(item.interval.start).toISOString().split("T")[0],
      games: total,
    };
  });
}
