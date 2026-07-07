import { useEffect, useState } from "react";

const SLOW_THRESHOLD_MS = 4000;

/** True once `loading` has stayed true past the threshold — a hint that the
 * Render free-tier backend is cold-starting, not that something's broken. */
export function useSlowLoad(loading: boolean): boolean {
  const [prevLoading, setPrevLoading] = useState(loading);
  const [slow, setSlow] = useState(false);

  if (loading !== prevLoading) {
    setPrevLoading(loading);
    if (loading) setSlow(false);
  }

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setSlow(true), SLOW_THRESHOLD_MS);
    return () => clearTimeout(timer);
  }, [loading]);

  return loading && slow;
}
