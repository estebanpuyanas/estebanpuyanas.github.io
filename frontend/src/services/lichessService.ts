const LICHESS_BASE = "https://lichess.org/api";
const USERNAME = "goldenorion9";

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
