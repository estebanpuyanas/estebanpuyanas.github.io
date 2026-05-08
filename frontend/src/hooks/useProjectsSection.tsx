import { useState, useEffect } from "react";

export interface GitHubRepo {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  updated_at: string;
  language: string | null;
  fork: boolean;
}

interface State {
  repos: GitHubRepo[];
  loading: boolean;
  error: boolean;
}

export function useProjectsSection(): State {
  const [state, setState] = useState<State>({
    repos: [],
    loading: true,
    error: false,
  });

  useEffect(() => {
    let cancelled = false;
    fetch(
      "https://api.github.com/users/estebanpuyanas/repos?per_page=100&sort=updated",
    )
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json() as Promise<GitHubRepo[]>;
      })
      .then((data) => {
        if (!cancelled)
          setState({
            repos: data.filter((r) => !r.fork),
            loading: false,
            error: false,
          });
      })
      .catch(() => {
        if (!cancelled) setState({ repos: [], loading: false, error: true });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
