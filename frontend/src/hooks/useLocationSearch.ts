import { useState, useReducer, useEffect, useCallback } from "react";
import { forwardGeocode, type GeoResult } from "../utils/nominatim";

interface SearchState {
  results: GeoResult[];
  open: boolean;
  loading: boolean;
  highlightIdx: number;
}

type SearchAction =
  | { type: "start" }
  | { type: "success"; results: GeoResult[] }
  | { type: "clear" }
  | { type: "set_open"; open: boolean }
  | { type: "set_highlight"; idx: number };

const searchInit: SearchState = {
  results: [],
  open: false,
  loading: false,
  highlightIdx: -1,
};

function searchReducer(s: SearchState, a: SearchAction): SearchState {
  switch (a.type) {
    case "start":
      return { ...s, loading: true };
    case "success":
      return {
        results: a.results,
        open: a.results.length > 0,
        loading: false,
        highlightIdx: -1,
      };
    case "clear":
      return searchInit;
    case "set_open":
      return { ...s, open: a.open };
    case "set_highlight":
      return { ...s, highlightIdx: a.idx };
  }
}

export function useLocationSearch(enabled: boolean) {
  const [locQuery, setLocQuery] = useState("");
  const [search, dispatch] = useReducer(searchReducer, searchInit);

  useEffect(() => {
    if (!enabled) return;
    const q = locQuery.trim();
    if (!q) {
      dispatch({ type: "clear" });
      return;
    }
    dispatch({ type: "start" });
    const t = setTimeout(async () => {
      const results = await forwardGeocode(q);
      dispatch({ type: "success", results });
    }, 400);
    return () => clearTimeout(t);
  }, [locQuery, enabled]);

  const setLocOpen = useCallback(
    (open: boolean) => dispatch({ type: "set_open", open }),
    [],
  );
  const setLocHighlightIdx = useCallback(
    (idx: number) => dispatch({ type: "set_highlight", idx }),
    [],
  );

  return {
    locQuery,
    setLocQuery,
    locResults: search.results,
    locOpen: search.open,
    setLocOpen,
    locLoading: search.loading,
    locHighlightIdx: search.highlightIdx,
    setLocHighlightIdx,
  };
}
