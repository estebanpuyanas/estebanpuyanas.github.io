const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

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

export interface LichessGame {
  id: string;
  speed: string;
  createdAt: number;
  result: "win" | "loss" | "draw";
  opponentName: string;
  opening?: string;
}

export async function getLichessUser(): Promise<LichessUser> {
  const res = await fetch(`${API_BASE}/api/chess/user`);
  if (!res.ok) throw new Error(`chess user fetch failed: ${res.status}`);
  return res.json();
}

export async function getLichessActivity(): Promise<LichessActivityDay[]> {
  const res = await fetch(`${API_BASE}/api/chess/activity`);
  if (!res.ok) throw new Error(`chess activity fetch failed: ${res.status}`);
  return res.json();
}

export async function getLichessRecentGames(max = 5): Promise<LichessGame[]> {
  const res = await fetch(`${API_BASE}/api/chess/recent-games?max=${max}`);
  if (!res.ok)
    throw new Error(`chess recent games fetch failed: ${res.status}`);
  return res.json();
}
