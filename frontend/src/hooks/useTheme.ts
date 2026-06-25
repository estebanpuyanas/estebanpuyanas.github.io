import { useState, useEffect } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "ep-theme";

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getSavedMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark" || saved === "system")
      return saved;
  } catch {
    // ignore localStorage read failures
  }
  return "system";
}

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(getSavedMode);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  // Track OS-level changes when in system mode
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) =>
      setSystemTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const resolvedTheme: ResolvedTheme = mode === "system" ? systemTheme : mode;

  // Apply to <html> whenever resolved theme changes
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);
  }, [resolvedTheme]);

  const setMode = (next: ThemeMode) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore localStorage write failures
    }
    setModeState(next);
  };

  return { mode, setMode, resolvedTheme };
}
