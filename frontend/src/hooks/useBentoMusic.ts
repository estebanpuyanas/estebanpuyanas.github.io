import { useState, useEffect } from "react";
import { getRecentTracks, type Track } from "../services/lastfmService";

export function useBentoMusic() {
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () =>
      getRecentTracks(1)
        .then((t) => setTrack(t[0] ?? null))
        .catch(() => {});

    load().finally(() => setLoading(false));
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  return { track, loading };
}
