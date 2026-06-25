import { useState, useEffect } from "react";
import type { Activity } from "react-activity-calendar";
import {
  getLichessUser,
  getLichessActivity,
  getLichessRecentGames,
  type LichessUser,
  type LichessActivityDay,
  type LichessGame,
} from "../services/lichessService";

export interface ChessState {
  user: LichessUser | null;
  activityData: Activity[];
  recentGames: LichessGame[];
  loading: boolean;
  error: boolean;
}

function countToLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

function buildActivityData(activity: LichessActivityDay[]): Activity[] {
  const actMap = new Map(activity.map((a) => [a.date, a.games]));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Align start to the Sunday 52 full weeks ago
  const start = new Date(today);
  start.setDate(today.getDate() - 52 * 7);
  start.setDate(start.getDate() - start.getDay());

  const result: Activity[] = [];
  const cur = new Date(start);

  while (cur <= today) {
    const dateStr = cur.toISOString().split("T")[0];
    const count = actMap.get(dateStr) ?? 0;
    result.push({ date: dateStr, count, level: countToLevel(count) });
    cur.setDate(cur.getDate() + 1);
  }

  return result;
}

export function useChess(): ChessState {
  const [user, setUser] = useState<LichessUser | null>(null);
  const [activityData, setActivityData] = useState<Activity[]>(() =>
    buildActivityData([]),
  );
  const [recentGames, setRecentGames] = useState<LichessGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      getLichessUser(),
      getLichessActivity(),
      getLichessRecentGames(5),
    ])
      .then(([userData, activity, games]) => {
        setUser(userData);
        setActivityData(buildActivityData(activity));
        setRecentGames(games);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return { user, activityData, recentGames, loading, error };
}
