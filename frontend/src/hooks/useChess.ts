import { useState, useEffect } from "react";
import {
  getLichessUser,
  getLichessActivity,
  getLichessRecentGames,
  getLichessCurrentGame,
  type LichessUser,
  type LichessActivityDay,
  type LichessGame,
  type LichessCurrentGame,
} from "../services/lichessService";

export interface HeatmapCell {
  date: string;
  count: number;
  future: boolean;
}

export interface ChessState {
  user: LichessUser | null;
  heatmap: HeatmapCell[][];
  recentGames: LichessGame[];
  currentGame: LichessCurrentGame | null;
  loading: boolean;
  error: boolean;
}

function buildHeatmap(activity: LichessActivityDay[]): HeatmapCell[][] {
  const actMap = new Map(activity.map((a) => [a.date, a.games]));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start from the Sunday 52 weeks ago
  const start = new Date(today);
  start.setDate(today.getDate() - 52 * 7);
  start.setDate(start.getDate() - start.getDay());

  const weeks: HeatmapCell[][] = [];
  const cur = new Date(start);

  for (let w = 0; w < 53; w++) {
    const week: HeatmapCell[] = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = cur.toISOString().split("T")[0];
      week.push({
        date: dateStr,
        count: actMap.get(dateStr) ?? 0,
        future: cur > today,
      });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  return weeks;
}

export function useChess(): ChessState {
  const [user, setUser] = useState<LichessUser | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapCell[][]>([]);
  const [recentGames, setRecentGames] = useState<LichessGame[]>([]);
  const [currentGame, setCurrentGame] = useState<LichessCurrentGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      getLichessUser(),
      getLichessActivity(),
      getLichessRecentGames(5),
      getLichessCurrentGame(),
    ])
      .then(([userData, activity, games, live]) => {
        setUser(userData);
        setHeatmap(buildHeatmap(activity));
        setRecentGames(games);
        setCurrentGame(live);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return { user, heatmap, recentGames, currentGame, loading, error };
}
