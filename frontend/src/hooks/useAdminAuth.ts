import { useState } from "react";

const TOKEN_KEY = "ep-admin-token";

const FUNNY_ERRORS = [
  "so close! ...probably not. try again.",
  "nope. but hey, points for persistence!",
  "to get the first 10 characters of the token, simply solve: ∫₀^π sin(x²)·e^(x³) dx, then SHA-256 the result. you're welcome.",
  "have you tried: being me? works every time.",
  "warm... warmer... nope, cold. very cold.",
  "you're literally one character off!",
  "hint: the token contains at least one character. that's all you get.",
  "error 418: I'm a teapot and you're also wrong.",
  "our advanced AI has analyzed your submission and determined it is, in fact, not the token.",
  "at this point the commitment is genuinely impressive. still no.",
  "token not found in database of valid tokens (there is exactly one valid token).",
  "maybe the token was the friends we made along the way.",
  "the token is stored somewhere safe. your brain is not that place.",
  "fun fact: typing the wrong token 13 times in a row does NOT unlock a secret mode. please stop.",
  "All this time and determination could have been spent applying to jobs, maybe consider this: https://careers.mcdonalds.com/",
];

export function getFunnyError(attempt: number, snippet: string): string {
  if (attempt === 3) {
    return `oh interesting — "${snippet}…" yeah, no.`;
  }
  return FUNNY_ERRORS[(attempt - 1) % FUNNY_ERRORS.length];
}

function getStoredToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    // eslint-disable-next-line no-console
    if (import.meta.env.DEV) console.warn("[AdminPage] localStorage read failed");
    return "";
  }
}

function storeToken(t: string) {
  try {
    localStorage.setItem(TOKEN_KEY, t);
  } catch {
    // eslint-disable-next-line no-console
    if (import.meta.env.DEV) console.warn("[AdminPage] localStorage write failed");
  }
}

function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // eslint-disable-next-line no-console
    if (import.meta.env.DEV) console.warn("[AdminPage] localStorage delete failed");
  }
}

export function useAdminAuth(onLogout: () => void) {
  const [token, setToken] = useState(getStoredToken);
  const [tokenInput, setTokenInput] = useState("");
  const [authError, setAuthError] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lastTokenSnippet, setLastTokenSnippet] = useState("");

  const handleLogin = () => {
    if (!tokenInput.trim()) return;
    storeToken(tokenInput.trim());
    setToken(tokenInput.trim());
    setTokenInput("");
    setAuthError(false);
  };

  const handleLogout = () => {
    clearToken();
    setToken("");
    onLogout();
  };

  const handleAuthError = () => {
    setLastTokenSnippet(token.slice(0, 6));
    clearToken();
    setToken("");
    setAuthError(true);
    setFailedAttempts((n) => n + 1);
  };

  return {
    token,
    tokenInput,
    setTokenInput,
    authError,
    failedAttempts,
    lastTokenSnippet,
    handleLogin,
    handleLogout,
    handleAuthError,
  };
}
