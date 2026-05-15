import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import type { ThemeMode } from "../../hooks/useTheme";

const NAV_ITEMS = [
  { label: "about", path: "/about" },
  { label: "education", path: "/education" },
  { label: "experience", path: "/experience" },
  { label: "projects", path: "/projects" },
  { label: "music", path: "/music" },
  { label: "travels", path: "/travels" },
];

const THEME_OPTIONS: { mode: ThemeMode; icon: string; label: string }[] = [
  { mode: "light", icon: "☀", label: "Light" },
  { mode: "dark",  icon: "☾", label: "Dark"  },
  { mode: "system", icon: "auto", label: "System" },
];

export default function NavBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { mode, setMode } = useTheme();

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <nav className="nav">
        <Link to="/" className="nav-logo">
          EP
        </Link>

        <ul className="nav-links nav-links-desktop">
          {NAV_ITEMS.map(({ label, path }) => (
            <li key={path}>
              <Link to={path} className="nav-link">
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="theme-switcher" role="group" aria-label="Theme">
          {THEME_OPTIONS.map(({ mode: m, icon, label }) => (
            <button
              key={m}
              className={`theme-btn${mode === m ? " theme-btn--active" : ""}`}
              onClick={() => setMode(m)}
              aria-label={`${label} theme`}
              aria-pressed={mode === m}
            >
              {icon}
            </button>
          ))}
        </div>

        <button
          className="nav-hamburger"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span className={`hamburger-bar${mobileOpen ? " bar-top-open" : ""}`} />
          <span className={`hamburger-bar${mobileOpen ? " bar-mid-open" : ""}`} />
          <span className={`hamburger-bar${mobileOpen ? " bar-bot-open" : ""}`} />
        </button>
      </nav>

      {mobileOpen && (
        <div className="mobile-menu">
          {NAV_ITEMS.map(({ label, path }) => (
            <Link
              key={path}
              to={path}
              className="mobile-link"
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
